import React, { useState, useEffect, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { getUserSubscription, getCurrentUser, editUser } from "../api/users";
import { requestPasswordReset } from "../api/auth";
import { User, EditUserParams, UserSubscription } from "../models/User";
import { useAuth } from "../contexts/AuthContext";
import { H6 } from "../components/Header";

export function UserSettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { logoutUser } = useAuth();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault(); // Prevent the default form submit action

    // Get the form data
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const updatedUsername = formData.get("username");
    const updatedEmail = formData.get("email");

    if (!user) {
      setError("User data is not loaded");
      return;
    }

    // Prepare the data to be updated
    const updateData = {
      username: updatedUsername,
      email: updatedEmail,
      is_admin: user.is_admin,
    };

    try {
      // Call the editUser function with userId and the update data
      await editUser(user.id.toString(), updateData as EditUserParams);
      // Optionally, navigate to another route upon success or just show success message
      // navigate('/some-success-page'); or
      alert("User updated successfully");

      const currentUser = await getCurrentUser();
      setUser(currentUser);

      localStorage.setItem("username", currentUser["username"]);
    } catch (error: any) {
      // Handle any errors that occur during the update
      console.error("Failed to update user:", error);
      setError(error.message);
    }
  }

  const handlePasswordReset = async () => {
    if (!user?.email) return;

    try {
      setIsLoading(true);
      const response = await requestPasswordReset(user.email);
      if (response.error) {
        setError(response.message);
      } else {
        setSuccess("Password reset link has been sent to your email address.");
      }
    } catch (error) {
      setError("Failed to initiate password reset.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    async function fetchUserAndSubscription() {
      let userResponse = await getCurrentUser();
      console.log(userResponse);
      setUser(userResponse);
      console.log(userResponse);

      // Now that we have the user, fetch their subscription using the user ID
      if (userResponse && userResponse["id"]) {
        let subscriptionResponse = await getUserSubscription(
          userResponse["id"],
        );
        console.log(subscriptionResponse);
        setSubscription(subscriptionResponse);
      }
    }

    document.title = "Zettelgarden - Settings";
    fetchUserAndSubscription();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">

      <div className="space-y-6">
        <div>
          <div>
            <H6 children="Settings" />
          </div>
          <form onSubmit={handleSubmit}>
            <div>
              <label>
                Username:
                <input
                  type="text"
                  name="username"
                  defaultValue={user?.username}
                />
              </label>
            </div>
            <div>
              <label>
                Email:
                <input type="email" name="email" defaultValue={user?.email} />
              </label>
            </div>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Save Changes
            </button>
          </form>
        </div>

        {/* Password Settings Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Password Settings</h2>
          <p className="text-gray-600 mb-4">
            To change your password, we'll send a password reset link to your email address.
          </p>
          <button
            onClick={handlePasswordReset}
            disabled={isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? "Sending..." : "Send Password Reset Link"}
          </button>
          {success && <div className="mt-2 text-green-600 text-sm">{success}</div>}
          {error && <div className="mt-2 text-red-600 text-sm">{error}</div>}
        </div>

        {/* Subscription Card */}
        {subscription && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Subscription</h2>
            <div className="space-y-2">
              <p>Status: <span className="font-medium">{subscription.stripe_subscription_status}</span></p>
              <p>Plan: <span className="font-medium">{subscription.stripe_subscription_frequency}</span></p>
              <a
                href="https://billing.stripe.com/p/login/test_28og184xZe4b51ecMM"
                className="text-blue-500 hover:underline"
              >
                Manage Subscription →
              </a>
            </div>
          </div>
        )}

        {/* Account Actions Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Account Actions</h2>
          <button
            onClick={() => {
              if (window.confirm("Are you sure you want to logout?")) {
                logoutUser();
                navigate("/login");
              }
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
