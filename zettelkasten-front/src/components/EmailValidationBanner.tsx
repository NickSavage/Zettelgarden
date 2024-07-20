import React from "react";
import { resendValidateEmail } from "../api/users";
import { User } from "../models/User";

interface EmailValidationBannerProps {
  user: User | null;
}

export function EmailValidationBanner({ user }: EmailValidationBannerProps) {
  function resendEmail() {
    resendValidateEmail();
  }
  if (!user) {
    return <div></div>;
  }
  if (user["email_validated"]) {
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
