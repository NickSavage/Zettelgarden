import React, { useState, useEffect } from "react";
import { getSuccessfulSessionData } from '../api/billing';

export function BillingSuccess() {
    const [sessionData, setSessionData] = useState(null);

    useEffect(() => {
        // Extract the CHECKOUT_SESSION_ID from the URL
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get('session_id');

        if (sessionId) {
            getSuccessfulSessionData(sessionId)
                .then(data => {
                    // Handle the session data, e.g., display it in the component
                    setSessionData(data);
		    console.log(data)
                })
                .catch(error => {
                    console.error('Failed to fetch session data:', error);
                    // Handle the error, e.g., show an error message
                });
        }
    }, []); // The empty array ensures this effect runs only once when the component mounts

    return (
        <div>
            {sessionData ? (
                <div>
                    {/* Render your session data here */}
                    <p>Success! Here's your session info:</p>
                    <pre>{JSON.stringify(sessionData, null, 2)}</pre>
                </div>
            ) : (
                <p>Loading session data...</p>
            )}
        </div>
    );
}
