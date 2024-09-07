import React, { useState, useEffect } from "react";
import { getUsers } from "../../api/users";
import { User } from "../../models/User";

import { UserListItem } from "../../components/users/UserListItem"

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
	    <UserListItem user={user} />
          ))}
      </table>
    </div>
  );
}
