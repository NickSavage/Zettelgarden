import { useEffect, useState } from "react";
import { changePassword, getUser } from "../api";


export function SettingsPage({}) {
  const [user, setUser] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const [message, setMessage] = useState('');

    const handleInputChange = (e) => {
	setInputValue(e.target.value);
	  
    };

    function handleSubmit () {
	changePassword(user["id"], inputValue)
	    .then(data => {
		console.log('Success:', data);
		setMessage(data);
		    
	    })
	    .catch((error) => {
		console.error('Error:', error);
		    
	    });;
    }
  useEffect(() => {
    getUser(1).then((d) => setUser(d));
  }, []);

    return (
	<div>
	    <div>{user && <h2>{user["name"]}</h2>}</div>
	    <div>{message && <p>{message}</p>}</div>
	    <div>
		<input
		    type="text"
		    value={inputValue}
		    onChange={handleInputChange}
		/>
		<button onClick={handleSubmit}>
		    Submit
		</button>
	    </div>
	</div>
    )
}
