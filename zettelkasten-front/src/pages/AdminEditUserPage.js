import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getUser, editUser } from "../api/users";

export function AdminEditUserPage() {
  const [user, setUser] = useState({
    username: "",
    email: "",
    is_admin: false,
  });
  const [error, setError] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    getUser(id).then((data) => setUser(data));
  }, [id]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setUser({
      ...user,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  async function handleSubmit(event) {
    event.preventDefault();
    await editUser(id, user)
      .then(() => {
        navigate(`/admin/user/${id}`); // Use backticks here for template literals
      })
      .catch((error) => {
        setError(error.message);
      });
  }

  return (
    <div>
      <h2>Edit User</h2>
      {error && <span>{error}</span>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Username:
            <input
              type="text"
              name="username"
              value={user.username}
              onChange={handleChange}
            />
          </label>
        </div>
        <div>
          <label>
            Email:
            <input
              type="email"
              name="email"
              value={user.email}
              onChange={handleChange}
            />
          </label>
        </div>
        <div>
          <label>
            Is Admin:
            <input
              type="checkbox"
              name="is_admin"
              checked={user.is_admin}
              onChange={handleChange}
            />
          </label>
        </div>
        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
}
