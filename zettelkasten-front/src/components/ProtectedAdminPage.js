import React, { useState, useEffect } from 'react';
import { useAuth } from "../AuthContext";
import { useNavigate, Link } from 'react-router-dom';

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

    return (
	<div>
	    <div className="top-bar">
		<h2><Link to="/admin">Zettelindex Admin</Link></h2>
	    </div>
	    <div className="main-content">
		<div className="sidebar">
		    <ul>
			<li><Link to="/admin">Index</Link></li>
		    </ul>
		</div>
		<div className="content">
		    {children}
		</div>
	    </div>
	</div>
    );
}
