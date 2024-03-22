import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCurrentUser, editUser } from "../api";

export function UserSettingsPage() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  function handleSubmit() {}
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
                <input type="text" name="username" value={user.username} />
              </label>
            </div>
            <div>
              <label>
                Email:
                <input type="email" name="email" value={user.email} />
              </label>
            </div>
            <button type="submit">Save Changes</button>
          </form>
        </div>
      }
    </div>
  );
}
