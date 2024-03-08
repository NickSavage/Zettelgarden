import React, { useState, useEffect } from 'react';
import { checkAdmin, getUsers } from "../api";

function NotAdmin() {
    return (
	<div>false</div>
    );
}
function Admin() {
    const [users, setUsers] = useState([]);
    useEffect(() => {
	const fetchUsers = async () => {
	    let tempUsers = await getUsers();
	    setUsers(tempUsers);
	};
	fetchUsers();
	
    }, [])
    console.log(users);
    return (
	<div>
	    <table>
		<tr>
		    <td>id</td>
		    <td>name</td>
		    <td>is_admin</td>
		    <td>created_at</td>
		    <td>updated_at</td>
		</tr>
		{users && users.map((user, index) => (
		    <tr>
			<td>{user["id"]}</td>
			<td>{user["name"]}</td>
			<td>{user["is_admin"]}</td>
			<td>{user["created_at"]}</td>
			<td>{user["updated_at"]}</td>
		    </tr>
		))}
	    </table>
	    </div>
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
