import React, { useState, useEffect } from "react";
import { getUser } from "../api";
import { useParams } from "react-router-dom";

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
      <ul>
        {user && (
          <div>
            <li>
              <b>Name:</b> {user["name"]}
            </li>
            <li>
              <b>id:</b> {user["id"]}
            </li>
            <li>
              <b>Is Admin:</b> {user["is_admin"] ? "True" : "False"}
            </li>
            <li>
              <b>Cards:</b> {user["cards"]}
            </li>
          </div>
        )}
      </ul>
    </div>
  );
}
