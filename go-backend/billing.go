package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"go-backend/models"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"github.com/stripe/stripe-go/v79"
	"github.com/stripe/stripe-go/v79/checkout/session"
	"github.com/stripe/stripe-go/v79/customer"
	"github.com/stripe/stripe-go/v79/price"
	"github.com/stripe/stripe-go/v79/webhook"
)

type StripeClient struct {
	testing bool
}

func (s *Server) createStripeClient() *StripeClient {
	client := &StripeClient{
		testing: s.testing,
	}

	return client
}

func (s *Server) syncStripePlans() error {
	log.Printf("start")
	stripe.Key = s.stripe_key

	params := &stripe.PriceListParams{
		Active: stripe.Bool(true),
	}
	params.AddExpand("data.product")
	iter := price.List(params)

	for iter.Next() {
		p := iter.Price()
		product := p.Product

		log.Printf("price %v", p)
		// Prepare data for insertion or update
		metadata, err := json.Marshal(product.Metadata)
		if err != nil {
			return fmt.Errorf("failed to marshal metadata: %w", err)
		}

		var interval, intervalCount sql.NullString
		var trialDays int64
		if p.Recurring != nil {
			interval = sql.NullString{String: string(p.Recurring.Interval), Valid: true}
			intervalCount = sql.NullString{String: fmt.Sprintf("%d", p.Recurring.IntervalCount), Valid: true}
			trialDays = p.Recurring.TrialPeriodDays
		}

		// Upsert query (PostgreSQL 9.5+)
		query := `
		INSERT INTO stripe_plans (stripe_product_id, stripe_price_id, name, description, active, unit_amount, currency, interval, interval_count, trial_days, metadata)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		ON CONFLICT (stripe_price_id)
		DO UPDATE SET
			name = EXCLUDED.name,
			description = EXCLUDED.description,
			active = EXCLUDED.active,
			unit_amount = EXCLUDED.unit_amount,
			currency = EXCLUDED.currency,
			interval = EXCLUDED.interval,
			interval_count = EXCLUDED.interval_count,
			trial_days = EXCLUDED.trial_days,
			metadata = EXCLUDED.metadata,
			updated_at = CURRENT_TIMESTAMP;
		`

		_, err = s.db.Exec(query,
			product.ID,
			p.ID,
			product.Name,
			product.Description,
			product.Active,
			p.UnitAmount,
			string(p.Currency),
			interval,
			intervalCount,
			trialDays,
			metadata,
		)
		if err != nil {
			return fmt.Errorf("failed to execute upsert query: %w", err)
		}
	}

	if err := iter.Err(); err != nil {
		return fmt.Errorf("error iterating through prices: %w", err)
	}

	return nil
}

func (s *Server) fetchPlanInformation(interval string) (models.StripePlan, error) {
	if interval != "month" && interval != "year" {
		return models.StripePlan{}, fmt.Errorf("Interval must be either month or year")
	}

	stmt, err := s.db.Prepare("SELECT id, stripe_price_id, name, unit_amount, currency, interval FROM stripe_plans WHERE interval = $1")
	if err != nil {
		return models.StripePlan{}, err
	}
	defer stmt.Close()

	var plan models.StripePlan
	err = stmt.QueryRow(interval).Scan(
		&plan.ID,
		&plan.StripePriceID,
		&plan.Name,
		&plan.UnitAmount,
		&plan.Currency,
		&plan.Interval,
	)
	if err != nil {
		log.Printf("err %v", err)
		return models.StripePlan{}, fmt.Errorf("something went wrong")
	}

	return plan, nil
}

func (s *Server) CreateCheckoutSession(w http.ResponseWriter, r *http.Request) {

	var params models.CreateCheckoutSessionParams

	decoder := json.NewDecoder(r.Body)
	err := decoder.Decode(&params)
	if err != nil {
		log.Printf("err? %v", err)
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	log.Printf("%v", params.Interval)
	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")
	log.Printf("%v", stripe.Key)

	plan, err := s.fetchPlanInformation(params.Interval)
	if err != nil {
		log.Printf("err? %v", err)
		http.Error(w, "Missing plan information", http.StatusInternalServerError)
		return

	}

	baseUrl := os.Getenv("ZETTEL_URL")
	checkoutParams := &stripe.CheckoutSessionParams{
		Mode: stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			&stripe.CheckoutSessionLineItemParams{
				Price:    stripe.String(plan.StripePriceID),
				Quantity: stripe.Int64(1),
			},
		},
		SuccessURL: stripe.String(baseUrl + "/app/settings/billing/success?session_id={CHECKOUT_SESSION_ID}"),
		CancelURL:  stripe.String(baseUrl + "/app/settings/billing/cancelled"),
	}

	sess, err := session.New(checkoutParams)
	if err != nil {
		log.Printf("session.New: %v", err)
	}

	result := &models.CreateCheckoutSessionResponse{
		URL: sess.URL,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

func (s *Server) GetSuccessfulSessionData(w http.ResponseWriter, r *http.Request) {
	var response models.GetSuccessfulSessionDataResponse
	sessionID := r.URL.Query().Get("session_id")

	s.syncStripePlans()
	stripe.Key = os.Getenv("STRIPE_SECRET_KEY")
	resource, err := session.Get(sessionID, &stripe.CheckoutSessionParams{})
	if err != nil {
		response.Error = err.Error()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}

	customer, err := customer.Get(resource.Customer.ID, &stripe.CustomerParams{})
	if err != nil {
		response.Error = err.Error()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
		return
	}

	json.NewEncoder(w).Encode(customer)
}

func (s *Server) handleCheckoutSessionComplete(event stripe.Event) error {
	stripe.Key = s.stripe_key
	var subscription stripe.Subscription
	err := json.Unmarshal(event.Data.Raw, &subscription)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error parsing webhook JSON: %v\n", err)
		return err
	}
	resource, err := session.Get(subscription.ID, &stripe.CheckoutSessionParams{})
	if err != nil {
		return err
	}
	customerID := resource.Customer.ID
	log.Printf("cus_id %v", customerID)
	customer, err := customer.Get(customerID, &stripe.CustomerParams{})
	if err != nil {
		log.Printf("cx err %v")
		return err
	}
	log.Printf("customer %v email %v", customer, customer.Email)
	var frequency string
	lineItemsIter := session.ListLineItems(&stripe.CheckoutSessionListLineItemsParams{})
	for lineItemsIter.Next() {
		lineItem := lineItemsIter.LineItem()
		frequency = lineItem.Description
		break
	}

	status := "active"

	_, err = s.db.Exec(`
		UPDATE users SET
			stripe_customer_id = $1,
			stripe_subscription_id = $2, 
			stripe_subscription_status = $3,
	        stripe_subscription_frequency = $4,
			updated_at = NOW()
		WHERE email = $5`, customerID, subscription.ID, status, frequency, customer.Email)

	if err != nil {
		log.Printf("error: %v", err)
		return fmt.Errorf("unable to update task")
	}
	return nil
}

func (s *Server) HandleWebhook(w http.ResponseWriter, r *http.Request) {
	const MaxBodyBytes = int64(65536)
	bodyReader := http.MaxBytesReader(w, r.Body, MaxBodyBytes)
	payload, err := ioutil.ReadAll(bodyReader)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error reading request body: %v\n", err)
		w.WriteHeader(http.StatusServiceUnavailable)
		return
	}
	endpointSecret := os.Getenv("STRIPE_ENDPOINT_SECRET")
	signatureHeader := r.Header.Get("Stripe-Signature")
	event, err := webhook.ConstructEvent(payload, signatureHeader, endpointSecret)
	if err != nil {
		fmt.Fprintf(os.Stderr, "⚠️  Webhook signature verification failed. %v\n", err)
		w.WriteHeader(http.StatusBadRequest) // Return a 400 error on a bad signature
		return
	}
	switch event.Type {
	case "checkout.session.completed":
		err = s.handleCheckoutSessionComplete(event)
	}
}
