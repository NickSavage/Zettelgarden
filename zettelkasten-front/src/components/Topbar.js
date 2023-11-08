import { useAuth } from "../AuthContext";
export function Topbar({
  handleNewCard,
  handleOpenSearch,
  handleViewSettings,
}) {
  const { logoutUser } = useAuth();

  function handleLogout() {
    logoutUser();
  }
  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <h2>Zettelkasten</h2>
      </div>
      <div className="top-bar-right">
        <button className="btn" onClick={handleNewCard}>
          New Card
        </button>
        <button className="btn" onClick={handleOpenSearch}>
          Search
        </button>
        <button className="btn" onClick={handleViewSettings}>
          Settings
        </button>
        <button className="btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}
