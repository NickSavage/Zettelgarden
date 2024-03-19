import React, { useState, useEffect } from "react";
import { getUser } from "../api";
import { Link, useParams } from "react-router-dom";

export function AdminUserDetailPage() {
  const [user, setUser] = useState(null);
  const { id } = useParams();

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
		    </div>
		</ul>
		<Link to={`/admin/user/${user['id']}/edit`}>Edit</Link>
	    </div>
        )}
    </div>
  );
}
