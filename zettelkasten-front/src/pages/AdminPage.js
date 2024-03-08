import React, { useState, useEffect } from 'react';
import { checkAdmin } from "../api";

function NotAdmin() {
    return (
	<div>false</div>
    );
}
function Admin() {
    return (
	<div>true</div>
    );
}

function AdminPage() {
    const [isAdmin, setIsAdmin] = useState(null);

    useEffect(() => {
        const fetchAdminStatus = async () => {
            const adminStatus = await checkAdmin();
            setIsAdmin(adminStatus);
        };

        fetchAdminStatus();
    }, []); // The empty array ensures this effect runs only once after the initial render

    // Handling the loading state
    if (isAdmin === null) {
        return <div>Loading...</div>; // Or any other loading indicator
    }

    return isAdmin ? <Admin /> : <NotAdmin />;
}

export default AdminPage;
