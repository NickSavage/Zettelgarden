import React, { useState, useEffect } from 'react';
import { useAuth } from "../AuthContext";
import { useNavigate } from 'react-router-dom';

export function ProtectedAdminPage({ children }) {
    const { isAdmin, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && !isAdmin) {
            navigate('/app');
        }
    }, [isAdmin, isLoading, navigate]);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (<div><span>test</span>
	    <div>{children}</div></div>);
}
