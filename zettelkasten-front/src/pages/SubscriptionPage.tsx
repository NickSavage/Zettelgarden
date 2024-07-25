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
    <div className="login-container">
      <h1>Select Your Subscription Plan</h1>
      <div className="subscription-options">
        <button
          onClick={handleMonthlySubscribe}
          className="subscription-button"
        >
          <div className="button-text">
            <div className="plan-name">Monthly Plan</div>
            <div className="plan-cost">$9.99 / month</div>
          </div>
        </button>
        <button onClick={handleAnnualSubscribe} className="subscription-button">
          <div className="button-text">
            <div className="plan-name">Annual Plan</div>
            <div className="plan-cost">$99.99 / year</div>
          </div>
        </button>
      </div>

      <span className="text">
        <Link to="/app" onClick={handleLogout}>
          Already have an account?
        </Link>
      </span>
    </div>
  );
}
