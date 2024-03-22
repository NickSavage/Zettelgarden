import { resendValidateEmail } from "../api";

export function EmailValidationBanner({user}) {

    function resendEmail() {
	resendValidateEmail();
    }
    if (user["email_validated"]) {
	return (<div></div>);
    }
  return (
    <div class="validation-banner">
	<span>Go validate your email. Click <a href="#" onClick={resendEmail}>here</a> to resend the email.</span>
    </div>
  );
}
