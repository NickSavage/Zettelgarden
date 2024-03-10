import React, { useState, useEffect } from 'react';
import { checkAdmin, getUsers } from "../api";
import { useAuth } from "../AuthContext";
import { useNavigate } from 'react-router-dom';

function NotAdmin() {
    return (
	<div>false</div>
    );
}
export function Admin() {
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
		    <td>cards</td>
		</tr>
		{users && users.map((user, index) => (
		    <tr>
			<td>{user["id"]}</td>
			<td>{user["name"]}</td>
			<td>{user["is_admin"]}</td>
			<td>{user["created_at"]}</td>
			<td>{user["updated_at"]}</td>
			<td>{user["cards"]}</td>
		    </tr>
		))}
	    </table>
	    </div>
    );
}
