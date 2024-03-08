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
    
    if (checkAdmin()) {
	return Admin();
    } else {
	return NotAdmin();
    }
}

export default AdminPage;
