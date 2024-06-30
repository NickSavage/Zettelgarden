import React, { useState, useEffect } from "react";
import { requestPasswordReset } from "../api/auth";
import { getUser } from "../api/users";
import { Link, useParams } from "react-router-dom";

import { User } from "../models/User";

export function AdminUserDetailPage() {
  const [user, setUser] = useState<User | null>(null);
  const { id } = useParams<{ id: string }>();

  function handlePasswordReset() {
    if (user === null) {
      return;
    }
    requestPasswordReset(user["email"]);
  }

  useEffect(() => {
    getUser(id!).then((d) => setUser(d));
  }, []);
  console.log(user);
  //console.log(user);
  return (
    <div>
      {user && (
        <div>
          <ul>
            <div>
              <li>
                <b>Name:</b> {user["username"]}
              </li>
              <li>
                <b>id:</b> {user["id"]}
              </li>
              <li>
                <b>Last Login: </b> {user["last_login"]}
              </li>
              <li>
                <b>Email:</b> {user["email"]}
              </li>
              <li>
                <b>Is Admin:</b> {user["is_admin"] ? "True" : "False"}
              </li>
              <li>
                <b>Stripe Customer ID: </b>
                <a
                  href={`https://dashboard.stripe.com/test/customers/${user["stripe_customer_id"]}`}
                >
                  {user["stripe_customer_id"]}
                </a>
              </li>
              <li>
                <b>Stripe Customer Status:</b>{" "}
                {user["stripe_subscription_status"]}
              </li>
              <li>
                <b>Is Active:</b> {user["is_active"] ? "Yes" : "No"}
              </li>
            </div>
          </ul>
          <Link to={`/admin/user/${user["id"]}/edit`}>Edit</Link>
          <br />
          <button onClick={handlePasswordReset}>
            Send Password Reset Email
          </button>
        </div>
      )}
    </div>
  );
}
