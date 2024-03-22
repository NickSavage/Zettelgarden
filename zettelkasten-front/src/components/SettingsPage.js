import { useEffect, useState } from "react";
import { changePassword, getCurrentUser } from "../api";
import { useAuth } from "../AuthContext";

export function SettingsPage({}) {
  const [user, setUser] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const { logoutUser } = useAuth();

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  function handleSubmit() {
    changePassword(user["id"], inputValue)
      .then((data) => {
        console.log("Success:", data);
        logoutUser();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }
    async function fetchUser() {
	let response = await getCurrentUser();
	console.log(response)
	setUser(response);
    }
  useEffect(() => {
      fetchUser();
  }, []);

  return (
    <div>
      <div>{user && <h2>{user["username"]}</h2>}</div>
      <div>
        <input type="text" value={inputValue} onChange={handleInputChange} />
        <button onClick={handleSubmit}>Submit</button>
      </div>
    </div>
  );
}
