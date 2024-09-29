import React, { useState, useEffect, FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserSubscription } from "../api/users";
import { getCurrentUser } from "../api/users";
import { editUser } from "../api/users";
import { User, EditUserParams, UserSubscription } from "../models/User";
import { PartialCard } from "../models/Card";
import { useAuth } from "../contexts/AuthContext";
import { H6 } from "../components/Header";
import { TagList } from "../components/tags/TagList";
import { BacklinkInput } from "../components/cards/BacklinkInput";
import { getCard } from "../api/cards";
import { isErrorResponse } from "../models/common";
import { CardLink } from "../components/cards/CardLink";

export function UserSettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const [dashboardPK, setDashboardPK] = useState<number>(0);
  const [dashboardCard, setDashboardCard] = useState<Card | null>(null);

  const navigate = useNavigate();
  const { logoutUser } = useAuth();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault(); // Prevent the default form submit action

    // Get the form data
    const formData = new FormData(event.currentTarget as TMLFormElement);
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
      dashboard_card_pk: dashboardPK,
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
    navigate("/login");
  }

  function handleAddBacklink(selectedCard: PartialCard) {
    setDashboardPK(selectedCard.id);
    fetchDashboardCard(selectedCard.id);
  }

  useEffect(() => {
    async function fetchUserAndSubscription() {
      let userResponse = await getCurrentUser();
      console.log(userResponse);
      setUser(userResponse);
      console.log(userResponse);

      setDashboardPK(userResponse.dashboard_card_pk);
      fetchDashboardCard(userResponse.dashboard_card_pk);

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

  async function fetchDashboardCard(id: number) {
    console.log("?");
    console.log(id);
    if (id == 0 || id == undefined) {
      return;
    }

    let card = await getCard(id);

    if (!isErrorResponse(card)) {
      setDashboardCard(card);
    }
  }

  return (
    <div>
      {error && <span>{error}</span>}

      {user && (
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
            <div className="mb-4">
              <label>Set Dashboard Card:</label>
	      <div className="flex items-center">
              <BacklinkInput addBacklink={handleAddBacklink} />

              {dashboardCard && (
                <CardLink
                  card={dashboardCard}
                  handleViewBacklink={(id: number) => {}}
                  showTitle={true}
                />
              )}
	      </div>
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
          <hr />
          <TagList />
        </div>
      )}
    </div>
  );
}
