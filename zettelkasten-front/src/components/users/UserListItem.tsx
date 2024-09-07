import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import { User } from "../../models/User";

interface UserListItemProps {
  user: User;
}

export function UserListItem({ user }: UserListItemProps) {
  return (
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
  );
}
