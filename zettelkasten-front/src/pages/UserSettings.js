import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUserSubscription } from "../api/users";
import { getCurrentUser } from "../api/users";
import { editUser } from "../api/users";

export function UserSettingsPage() {
  const [user, setUser] = useState(null);
    const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault(); // Prevent the default form submit action

    // Get the form data
    const formData = new FormData(event.currentTarget);
    const updatedUsername = formData.get('username');
    const updatedEmail = formData.get('email');

    // Prepare the data to be updated
    const updateData = {
      username: updatedUsername,
      email: updatedEmail,
    };

    try {
      // Call the editUser function with userId and the update data
      await editUser(user.id, updateData);
      // Optionally, navigate to another route upon success or just show success message
      // navigate('/some-success-page'); or
      alert('User updated successfully');
    } catch (error) {
      // Handle any errors that occur during the update
      console.error('Failed to update user:', error);
      setError(error.message);
    }
  }

useEffect(() => {
  async function fetchUserAndSubscription() {
    let userResponse = await getCurrentUser();
    console.log(userResponse);
    setUser(userResponse);

    // Now that we have the user, fetch their subscription using the user ID
    if (userResponse && userResponse["id"]) {
      let subscriptionResponse = await getUserSubscription(userResponse["id"]);
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

      {
          user &&
              <div>
		  <h2>Edit User: {user["username"]}</h2>
          <form onSubmit={handleSubmit}>
            <div>
              <label>
                Username:
                <input type="text" name="username" defaultValue={user.username} />
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
		  {subscription &&
		   <div>
		       <h2>Subscription</h2>
		       <p>Subscription Status: {subscription["stripe_subscription_status"]}</p>
		       <p>Current Plan: {subscription["stripe_subscription_frequency"]}</p>
		       <p>Visit the <a href="https://billing.stripe.com/p/login/test_28og184xZe4b51ecMM">billing portal</a> to manage or cancel your plan.</p>
		   </div>
		  }
        </div>
      }
    </div>
  );
}
