import React, { useState, useEffect } from "react";
import { getUsers } from "../api/users";
import { Link } from "react-router-dom";
import { User } from "../models/User";

export function AdminUserIndex() {
  const [users, setUsers] = useState<User[]>([]);
  useEffect(() => {
    const fetchUsers = async () => {
      let tempUsers = await getUsers();
      setUsers(tempUsers);
    };
    fetchUsers();
  }, []);
  return (
    <div>
      <table>
        <tr>
          <td>id</td>
          <td>name</td>
          <td>is_admin</td>
          <td>last_login</td>
          <td>email</td>
          <td>email_validated</td>
          <td>stripe_subscription_status</td>
          <td>created_at</td>
          <td>cards</td>
        </tr>
        {users &&
          users.map((user, index) => (
            <tr>
              <td>{user["id"]}</td>
              <td>
                <Link to={`/admin/user/${user.id}`}>{user.username}</Link>
              </td>
              <td>{user["is_admin"] ? "Yes" : "No"}</td>
              <td>{user["last_login"]}</td>
              <td>{user["email"]}</td>
              <td>{user["email_validated"] ? "Yes" : "No"}</td>
              <td>{user["stripe_subscription_status"]}</td>
              <td>{user["created_at"]}</td>
            </tr>
          ))}
      </table>
    </div>
  );
}
