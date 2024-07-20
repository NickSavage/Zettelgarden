import React from "react";
import { resendValidateEmail } from "../api/users";
import { User } from "../models/User";
import { useAuth } from "../contexts/AuthContext";

export function EmailValidationBanner() {
  const { currentUser } = useAuth();
  function resendEmail() {
    resendValidateEmail();
  }
  if (!currentUser) {
    return <div></div>;
  }
  if (currentUser["email_validated"]) {
    return <div></div>;
  }
  return (
    <div className="validation-banner">
      <span>
        Go validate your email. Click{" "}
        <a href="#" onClick={resendEmail}>
          here
        </a>{" "}
        to resend the email.
      </span>
    </div>
  );
}
