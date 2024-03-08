import MainApp from "./pages/MainApp";
import { Routes, Route } from "react-router-dom";


function App() {
    return (
	<div>
	    <Routes>
		<Route path="/app" element={<MainApp />} />
	    </Routes>
	</div>
    );
}

export default App;
