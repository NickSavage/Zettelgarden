
export function Topbar({handleNewCard, handleOpenSearch, handleViewSettings}) {
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
	    </div>
	    </div>
	
    )
}
