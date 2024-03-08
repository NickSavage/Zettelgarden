import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function LandingPage() {
    const navigate = useNavigate();

    useEffect(() => {
        navigate('/app');
    }, [navigate]); // Dependency array to ensure the effect runs once

    return <div>Redirecting...</div>;
}

export default LandingPage;
