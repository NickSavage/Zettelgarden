import { useNavigate, Link } from "react-router-dom";

export function AdminTopBar({ children }) {
  const navigate = useNavigate();

  return (
      <div className="top-bar">
	  <div className="top-bar-left">
              <div className="top-bar-index">
		  <h1>
		      <Link to="/admin">Zettelindex Admin</Link>
		  </h1>
              </div>
	  </div>
	  <div className="top-bar-right">
	      <button className="btn">
		  
		  <Link to="/app">Back To App</Link>
	      </button>
	  </div>
      </div>

  );
}

export default AdminTopBar;
