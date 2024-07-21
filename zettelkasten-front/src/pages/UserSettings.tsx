import React, { useState, useEffect, FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserSubscription } from "../api/users";
import { getCurrentUser } from "../api/users";
import { editUser } from "../api/users";
import { User, EditUserParams, UserSubscription } from "../models/User";
import { useAuth } from "../contexts/AuthContext";
import { HeaderTop } from "../components/Header";

export function UserSettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
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
    } catch (error: any) {
      // Handle any errors that occur during the update
      console.error("Failed to update user:", error);
      setError(error.message);
    }
  }
  function handleLogout() {
    logoutUser();
  }

  useEffect(() => {
    async function fetchUserAndSubscription() {
      let userResponse = await getCurrentUser();
      console.log(userResponse);
      setUser(userResponse);

      // Now that we have the user, fetch their subscription using the user ID
      if (userResponse && userResponse["id"]) {
        let subscriptionResponse = await getUserSubscription(
          userResponse["id"]
        );
        console.log(subscriptionResponse);
        setSubscription(subscriptionResponse);
      }
    }

    document.title = "Zettelgarden - Settings";
    fetchUserAndSubscription();
  }, []);

  return (
    <div>
      {error && <span>{error}</span>}

      {user && (
        <div>
          <div>
            <HeaderTop text="Settings" />
          </div>
          <form onSubmit={handleSubmit}>
            <div>
              <label>
                Username:
                <input
                  type="text"
                  name="username"
                  defaultValue={user.username}
                />
              </label>
            </div>
            <div>
              <label>
                Email:
                <input type="email" name="email" defaultValue={user.email} />
              </label>
            </div>
            <button type="submit">Save Changes</button>
          </form>
          {subscription && (
            <div>
              <h2>Subscription</h2>
              <p>
                Subscription Status:{" "}
                {subscription["stripe_subscription_status"]}
              </p>
              <p>
                Current Plan: {subscription["stripe_subscription_frequency"]}
              </p>
              <p>
                Visit the{" "}
                <a href="https://billing.stripe.com/p/login/test_28og184xZe4b51ecMM">
                  billing portal
                </a>{" "}
                to manage or cancel your plan.
              </p>
            </div>
          )}
          <span onClick={handleLogout}>Logout</span>
        </div>
      )}
    </div>
  );
}
