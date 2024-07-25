package main

import (
	"encoding/json"
	"fmt"
	"go-backend/models"
	"log"
	"net/http"
	"os"

	"github.com/stripe/stripe-go/v79"
	"github.com/stripe/stripe-go/v79/checkout/session"
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

func (s *Server) createCheckoutSession(w http.ResponseWriter, r *http.Request) {

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
		SuccessURL: stripe.String(baseUrl + "/success.html?session_id={CHECKOUT_SESSION_ID}"),
		CancelURL:  stripe.String(baseUrl + "/cancel.html"),
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
