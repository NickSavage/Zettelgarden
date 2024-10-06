import React from "react";
import { createCheckoutSession } from "../api/billing";
import { useAuth } from "../contexts/AuthContext";

import { Link } from "react-router-dom";

export function SubscriptionPage() {
  const { logoutUser } = useAuth();

  async function handleMonthlySubscribe() {
    let response = await createCheckoutSession("month");
    window.location.href = response.redirect_url;
  }

  async function handleAnnualSubscribe() {
    let response = await createCheckoutSession("year");
    window.location.href = response.redirect_url;
  }

  function handleLogout() {
    logoutUser();
  }
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <h1 className="text-3xl font-bold text-center mb-8">
        Select Your Subscription Plan
      </h1>
      <div className="flex space-x-4">
        <button
          onClick={handleMonthlySubscribe}
          className="flex flex-col items-center justify-center bg-indigo-500 text-white p-6 rounded-lg shadow-md hover:bg-indigo-600 transition duration-200"
        >
          <div className="plan-name text-xl font-semibold">Monthly Plan</div>
          <div className="plan-cost text-lg mt-2">$9.99 / month</div>
        </button>
        <button
          onClick={handleAnnualSubscribe}
          className="flex flex-col items-center justify-center bg-indigo-500 text-white p-6 rounded-lg shadow-md hover:bg-indigo-600 transition duration-200"
        >
          <div className="plan-name text-xl font-semibold">Annual Plan</div>
          <div className="plan-cost text-lg mt-2">$99.99 / year</div>
        </button>
      </div>
      <span className="text-center mt-8">
        <Link
          to="/login"
          onClick={handleLogout}
          className="text-indigo-500 hover:underline"
        >
          Already have an account?
        </Link>
      </span>
    </div>
  );
}
