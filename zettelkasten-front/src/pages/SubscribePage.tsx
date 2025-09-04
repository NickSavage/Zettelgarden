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
    <div className="max-w-md mx-auto bg-white shadow-md rounded-lg p-6 text-center mt-10">
      <h1 className="text-3xl font-bold text-indigo-700">Upgrade to Pro</h1>
      <p className="text-gray-600 mt-2">
        Unlock your full potential with Zettelgarden Pro.
      </p>

      <ul className="text-left mt-6 space-y-2">
        <li className="flex items-center">
          <span className="text-green-600 mr-2">✓</span> AI-Powered Entity and Fact Extraction
        </li>
        <li className="flex items-center">
          <span className="text-green-600 mr-2">✓</span> Card Summarization and Analysis
        </li>
        <li className="flex items-center">
          <span className="text-green-600 mr-2">✓</span> Early Access To New Features
        </li>
      </ul>

      <div className="flex gap-4 justify-center my-6">
        <button
          onClick={() => setPlan("monthly")}
          className={`px-4 py-2 rounded-lg border ${
            plan === "monthly"
              ? "bg-indigo-700 text-white border-indigo-700"
              : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
          }`}
        >
          <div className="flex flex-col">
            <span className="font-medium">Monthly</span>
            <span className="text-sm text-gray-200 md:text-gray-100 text-opacity-90">
              $10 / month
            </span>
          </div>
        </button>
        <button
          onClick={() => setPlan("annual")}
          className={`px-4 py-2 rounded-lg border ${
            plan === "annual"
              ? "bg-indigo-700 text-white border-indigo-700"
              : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
          }`}
        >
          <div className="flex flex-col">
            <span className="font-medium">Annual</span>
            <span className="text-sm">
              $100 / year{" "}
              <span className="text-green-600">(Save 20%)</span>
            </span>
          </div>
        </button>
      </div>

      <button
        onClick={startSubscription}
        disabled={loading}
        className="w-full bg-indigo-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {loading ? "Redirecting..." : `Subscribe (${plan})`}
      </button>

      {error && (
        <p className="mt-4 text-red-600 bg-red-50 p-2 rounded border border-red-200">
          {error}
        </p>
      )}
    </div>
  );
}
