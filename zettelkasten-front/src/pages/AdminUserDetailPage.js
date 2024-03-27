import React, { useState, useEffect } from "react";
import { getUser, requestPasswordReset } from "../api";
import { Link, useParams } from "react-router-dom";

export function AdminUserDetailPage() {
  const [user, setUser] = useState(null);
  const { id } = useParams();

    function handlePasswordReset() {
	requestPasswordReset(user["email"]);
    }

  useEffect(() => {
    getUser(id).then((d) => setUser(d));
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
                <b>Email:</b> {user["email"]}
              </li>
              <li>
                <b>Is Admin:</b> {user["is_admin"] ? "True" : "False"}
              </li>
              <li>
                <b>Cards:</b> {user["cards"]}
              </li>
		<li>
		    <b>Stripe Customer ID: </b> 
		    <a href={`https://dashboard.stripe.com/test/customers/${user["stripe_customer_id"]}`}>
			{user["stripe_customer_id"]}
		    </a>
		</li>
		<li>
		    <b>Stripe Customer Status:</b> {user["stripe_subscription_status"]}
		</li>
		<li><b>Is Active:</b> {user["is_active"] ? "Yes" : "No"}</li>
            </div>
          </ul>
          <Link to={`/admin/user/${user["id"]}/edit`}>Edit</Link><br />
	  <button onClick={handlePasswordReset}>Send Password Reset Email</button>
        </div>
      )}
    </div>
  );
}
