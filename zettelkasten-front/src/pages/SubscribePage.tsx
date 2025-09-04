import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

const base_url = import.meta.env.VITE_URL;

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

export default function SubscribePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSubscription = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${base_url}/billing/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`, // adjust auth storage as needed
        },
        body: JSON.stringify({ price_id: "price_1Qjf7ICT2XDlG7vRIhvmi9HR" }), // replace with real Stripe price ID
      });

      if (!res.ok) {
        throw new Error("Failed to start checkout");
      }

      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 items-center mt-10">
      <h1 className="text-2xl font-bold">Subscribe to Pro</h1>
      <p>Get full access to Zettelgarden by subscribing.</p>
      <button
        onClick={startSubscription}
        disabled={loading}
        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
      >
        {loading ? "Redirecting..." : "Subscribe"}
      </button>
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
