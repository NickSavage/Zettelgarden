import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCurrentUser, editUser } from "../api";

export function UserSettingsPage() {
  const [user, setUser] = useState(null);
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

  async function fetchUser() {
    let response = await getCurrentUser();
    console.log(response);
    setUser(response);
  }
  useEffect(() => {
    fetchUser();
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
        </div>
      }
    </div>
  );
}
