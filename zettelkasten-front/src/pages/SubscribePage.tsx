import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

const base_url = import.meta.env.VITE_URL;

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY!);

export default function SubscribePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<"monthly" | "annual">("monthly");

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
        body: JSON.stringify({ plan }),
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
      <div className="flex gap-2 my-4">
        <button
          onClick={() => setPlan("monthly")}
          className={`px-4 py-2 rounded ${plan === "monthly" ? "bg-indigo-700 text-white" : "bg-gray-200"}`}
        >
          Monthly
        </button>
        <button
          onClick={() => setPlan("annual")}
          className={`px-4 py-2 rounded ${plan === "annual" ? "bg-indigo-700 text-white" : "bg-gray-200"}`}
        >
          Annual
        </button>
      </div>
      <button
        onClick={startSubscription}
        disabled={loading}
        className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
      >
        {loading ? "Redirecting..." : `Subscribe (${plan})`}
      </button>
      {error && <p className="text-red-600">{error}</p>}
    </div>
  );
}
