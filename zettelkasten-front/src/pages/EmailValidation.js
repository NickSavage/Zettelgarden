import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { validateEmail } from "../api"; // Ensure this is implemented in api.js

function EmailValidation() {
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Extract the token from the URL
    const query = new URLSearchParams(location.search);
    const token = query.get("token");
    if (token) {
      setToken(token);
      // Automatically attempt to validate the email when the component mounts with a token
      handleValidateEmail(token);
    }
  }, [location]);

  const handleValidateEmail = async (token) => {
    setMessage("");
    try {
      const response = await validateEmail(token);
      if (response.error) {
        setMessage(response.error);
      } else {
        setMessage("Your email has been successfully validated.");
        navigate("/login", {
          state: { message: "Your email has been successfully validated." },
        });
      }
    } catch (error) {
      setMessage("Failed to validate email.");
    }
  };

  // Optional: Render a button to manually trigger email validation if needed
  const renderValidateButton = () => (
    <button onClick={() => handleValidateEmail(token)} disabled={!token}>
      Validate Email
    </button>
  );

  return (
    <div className="validation-container">
      <h2>Email Validation</h2>
      {message && <div>{message}</div>}
      {/* Optionally render the validate button */}
      {/* token && renderValidateButton() */}
    </div>
  );
}

export default EmailValidation;
