import AdminPage from "./pages/AdminPage";
import LandingPage from "./pages/LandingPage";
import LoginForm from "./pages/LoginPage";
import MainApp from "./pages/MainApp";
import { Routes, Route } from "react-router-dom";


function App() {
    return (
	<div>
	    <Routes>
		<Route path="/" element={<LandingPage />} />
		<Route path="/app" element={<MainApp />} />
		<Route path="/admin" element={<AdminPage />} />
		<Route path="/login" element={<LoginForm />} />
	    </Routes>
	</div>
    );
}

export default App;
