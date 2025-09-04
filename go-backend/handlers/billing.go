package handlers

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"github.com/stripe/stripe-go/v82"
	"github.com/stripe/stripe-go/v82/checkout/session"
	"github.com/stripe/stripe-go/v82/customer"
	"github.com/stripe/stripe-go/v82/webhook"
)

type SubscribeRequest struct {
	Plan string `json:"plan"`
}

type SubscribeResponse struct {
	CheckoutURL string `json:"checkout_url"`
}

// POST /api/billing/subscribe
func (s *Handler) CreateSubscriptionRoute(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("current_user").(int)

	var body SubscribeRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	user, err := s.QueryUser(userID)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// Ensure customer exists
	if user.StripeCustomerID == "" {
		params := &stripe.CustomerParams{
			Email: stripe.String(user.Email),
		}
		c, err := customer.New(params)
		if err != nil {
			log.Printf("Stripe customer create failed: %v", err)
			http.Error(w, "Stripe customer creation failed", http.StatusInternalServerError)
			return
		}
		_, err = s.DB.Exec(`UPDATE users SET stripe_customer_id=$1 WHERE id=$2`, c.ID, user.ID)
		if err != nil {
			log.Printf("DB update customer id failed: %v", err)
		}
		user.StripeCustomerID = c.ID
	}

	// Map plan string to Stripe Price ID
	planToPriceID := map[string]string{
		"monthly": os.Getenv("STRIPE_MONTH_PRICE"),
		"annual":  os.Getenv("STRIPE_YEAR_PRICE"),
	}

	priceID, ok := planToPriceID[body.Plan]
	if !ok || priceID == "" {
		http.Error(w, "Invalid plan", http.StatusBadRequest)
		return
	}

	// Create checkout session
	params := &stripe.CheckoutSessionParams{
		SuccessURL: stripe.String(fmt.Sprintf("%s/app/settings/billing/success?session_id={CHECKOUT_SESSION_ID}", os.Getenv("ZETTEL_URL"))),
		CancelURL:  stripe.String(fmt.Sprintf("%s/app/subscription", os.Getenv("ZETTEL_URL"))),
		Mode:       stripe.String("subscription"),
		Customer:   stripe.String(user.StripeCustomerID),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(priceID),
				Quantity: stripe.Int64(1),
			},
		},
	}
	sess, err := session.New(params)
	if err != nil {
		log.Printf("Stripe session create failed: %v", err)
		http.Error(w, "Stripe checkout session failed", http.StatusInternalServerError)
		return
	}

	resp := SubscribeResponse{CheckoutURL: sess.URL}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

type BillingPortalResponse struct {
	URL string `json:"url"`
}

// GET /api/billing/portal
func (s *Handler) BillingPortalRoute(w http.ResponseWriter, r *http.Request) {
	resp := BillingPortalResponse{URL: os.Getenv("STRIPE_BILLING_URL")}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

type StripePublicKeyResponse struct {
	Key string `json:"key"`
}

// GET /api/billing/public-key
func (s *Handler) StripePublicKeyRoute(w http.ResponseWriter, r *http.Request) {
	resp := StripePublicKeyResponse{Key: os.Getenv("STRIPE_PUBLISHABLE_KEY")}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// POST /api/stripe/webhook
func (s *Handler) StripeWebhookRoute(w http.ResponseWriter, r *http.Request) {
	const MaxBodyBytes = int64(65536)
	r.Body = http.MaxBytesReader(w, r.Body, MaxBodyBytes)
	payload, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Request body read error", http.StatusServiceUnavailable)
		return
	}

	endpointSecret := os.Getenv("STRIPE_WEBHOOK_SECRET")
	event, err := webhook.ConstructEvent(payload, r.Header.Get("Stripe-Signature"), endpointSecret)
	if err != nil {
		log.Printf("⚠️  Webhook signature verification failed: %v\n", err)
		http.Error(w, "Signature verification failed", http.StatusBadRequest)
		return
	}

	switch event.Type {
	case "checkout.session.completed":
		var sess stripe.CheckoutSession
		err := json.Unmarshal(event.Data.Raw, &sess)
		if err == nil && sess.Subscription != nil && sess.Customer != nil {
			_, dberr := s.DB.Exec(
				`UPDATE users SET stripe_subscription_id=$1, stripe_subscription_status='active' 
				WHERE stripe_customer_id=$2`,
				sess.Subscription.ID, sess.Customer.ID,
			)
			if dberr != nil {
				log.Printf("DB update error: %v", dberr)
			}
		}
	case "invoice.payment_failed":
		var inv stripe.Invoice
		if err := json.Unmarshal(event.Data.Raw, &inv); err == nil {
			if inv.Customer != nil {
				_, dberr := s.DB.Exec(
					`UPDATE users SET stripe_subscription_status='past_due' WHERE stripe_customer_id=$1`,
					inv.Customer.ID,
				)
				if dberr != nil {
					log.Printf("DB update error: %v", dberr)
				}
			}
		}
	case "customer.subscription.deleted":
		var sub stripe.Subscription
		if err := json.Unmarshal(event.Data.Raw, &sub); err == nil {
			_, dberr := s.DB.Exec(
				`UPDATE users SET stripe_subscription_status='canceled' WHERE stripe_customer_id=$1`,
				sub.Customer.ID,
			)
			if dberr != nil {
				log.Printf("DB update error: %v", dberr)
			}
		}
	}

	w.WriteHeader(http.StatusOK)
}
