import {useEffect, useState} from 'react';
import {getUser} from "../api";

export function SettingsPage({}) {
    const [user, setUser] = useState(null);

    useEffect(() => {
	getUser(1).then((d) => setUser(d));
    }, [])

    return (<div>{user && <h2>{user["name"]}</h2>}</div>)
}
