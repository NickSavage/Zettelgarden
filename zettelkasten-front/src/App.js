import AdminPage from "./pages/AdminPage";
import LandingPage from "./pages/LandingPage";
import MainApp from "./pages/MainApp";
import { Routes, Route } from "react-router-dom";


function App() {
    return (
	<div>
	    <Routes>
		<Route path="/" element={<LandingPage />} />
		<Route path="/app" element={<MainApp />} />
		<Route path="/admin" element={<AdminPage />} />
	    </Routes>
	</div>
    );
}

export default App;
