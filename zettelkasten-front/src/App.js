
import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
    const [error, setError] = useState("");
    const [cards, setCards] = useState([]);
    const [mainCards, setMainCards] = useState([]);
    const [sidebarCards, setSidebarCards] = useState([]);
    const [unfilteredSidebarCards, setUnfilteredSidebarCards] = useState([]);
    const [newCard, setNewCard]= useState(null);
    const [viewingCard, setViewingCard] = useState(null);
    const [parentCard, setParentCard] = useState(null);
    const [editingCard, setEditingCard] = useState(null);
    const [searchCard, setSearchCard] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('');
    const [isSidebarHidden, setIsSidebarHidden] = useState(false);
    const [lastCardId, setLastCardId] = useState('');
    const [inputBlurred, setInputBlurred] = useState(false);

    // API
    const base_url = process.env.REACT_APP_URL;
    const username = process.env.REACT_APP_USERNAME;
    const password = process.env.REACT_APP_PASSWORD;
    const creds = btoa(`${username}:${password}`);

    const toggleSidebar = () => {
	setIsSidebarHidden(!isSidebarHidden);
    };

    function fetchCards() {
	return fetch(base_url + '/cards', {headers: {"Authorization": `Basic ${creds}`}})
	    .then(response => response.json())
	
    }

    function getCard(id) {
	// Assuming your backend is running on the same IP and port as in previous example
	let encoded = encodeURIComponent(id)
	const url = base_url + `/cards/${encoded}`;

	// Send a GET request to the URL
	return fetch(url, {headers: {"Authorization": `Basic ${creds}`}})
	    .then(response => {
		// Check if the response is successful (status code in the range 200-299)
		if (response.ok) {
		    // Parse and return the JSON response
		    return response.json();
		          
		} else {
		    // Throw an error if the response is not successful
		    throw new Error('Failed to fetch card');
		}
	    })
	    .then(cardData => {
		// Process the card data here (if needed) and return it
		return cardData;
		    
	    });
	
    }

    async function handleSaveCard() {
	const url = newCard ?
	      base_url + `/cards`:
	      base_url + `/cards/${encodeURIComponent(editingCard.id)}` ;
	const method = newCard ? 'POST' : 'PUT';

	let card = editingCard;
	let id = card.id

	setInputBlurred(false);

	fetch(url, {
	    method: method,
	    headers: {
		"Authorization": `Basic ${creds}`,
		'Content-Type': 'application/json',
		        
	    },
	    body: JSON.stringify(card),
	        
	})
	    .then(response => response.json())
	    .then(response => {
		if (!("error" in response)) {
		    handleViewCard(response);
		} else {
		    setError(response["error"]);
		}
		setAllCards();
	    });
    }

    // helper

    function getIdByCardId(targetCardId) {
	const foundCard = cards.find(card => card.card_id === targetCardId);
	return foundCard ? foundCard.id : null;
	
    }

    // Function to check if card_id is unique
    const isCardIdUnique = (id) => {
	return !cards.some(card => card.card_id === id);
	  
    };

    
    function handleFilter(e) {
	let filter = e.target.value;
	setFilter(filter);
	  
	const filteredCards = unfilteredSidebarCards.filter(
	    card => card.card_id.toLowerCase().includes(filter) || card.title.toLowerCase().includes(filter)
	);
	setSidebarCards(filteredCards);
    }
    function handleSearch(e) {
	setSearchTerm(e.target.value);
    }

    // changing pages

    function changePage() {
	setError(null);
	setViewingCard(null);
	setLastCardId(null);
	setEditingCard(null);
	setSearchCard(null);
	setNewCard(null);
	setInputBlurred(false);
    }

    function handleOpenSearch() {
	changePage();
	document.title = "Zettelkasten - Search"
	setSearchCard(true);
    }

    function handleNewCard() {
	changePage();
	setNewCard(true);
	setEditingCard({ card_id: lastCardId, title: '', body: '' });
	document.title = "Zettelkasten - New Card";
    }

    function handleViewCard(card) {
	changePage();
	document.title = "Zettelkasten - " + card.card_id + " - "+ card.title;
	setViewingCard(card);
	setLastCardId(card.card_id)
    }

    function handleEditCard() {
	changePage();
	document.title = "Zettelkasten - Edit Card";
	setEditingCard(viewingCard);
    }

    const handleSortChange = (event) => {
	const value = event.target.value;
	let temp = [...sidebarCards];
	if (value === "sortBigSmall" || value === "sortSmallBig") {
	    temp.sort((a, b) => {
		const partsA = a.card_id.match(/\D+|\d+/g) || [];
		const partsB = b.card_id.match(/\D+|\d+/g) || [];
		for (let i = 0; i < Math.min(partsA.length, partsB.length); i++) {
		    if (isNaN(partsA[i]) || isNaN(partsB[i])) {
			// Compare non-numeric parts lexicographically
			const comparison = partsA[i].localeCompare(partsB[i]);
			if (comparison !== 0) return value === "sortBigSmall" ? comparison : -comparison;
		    } else {
			// Compare numeric parts numerically
			const comparison = parseInt(partsA[i]) - parseInt(partsB[i]);
			if (comparison !== 0) return value === "sortBigSmall" ? comparison : -comparison;
		    }
		}
		return (value === "sortBigSmall" ? 1 : -1) * (partsA.length - partsB.length);
	    });
	}
	else if (value === "sortNewOld") {
	    temp.sort((a, b) => {
		return new Date(b.updated_at) - new Date(a.updated_at);
	    });
	} else if (value === "sortOldNew") {
	    temp.sort((a, b) => {
		return new Date(a.updated_at) - new Date(b.updated_at);
	    });
	    
	} else {
	    
	}
	setSidebarCards(temp);
    }
    function handleSelectChange (event) {
	const value = event.target.value;
	changeSidebarView(value)
    }

    function changeSidebarView(value) {
	setFilter('');
	if (value === "reference") {
	    const referenceCards = cards.filter(card => card.card_id.startsWith('REF'));
	    setSidebarCards(referenceCards);
	    setUnfilteredSidebarCards(referenceCards);
	        
	} else if (value === "meeting") {
	    const meetingCards = cards.filter(card => card.card_id.startsWith('SM'));
	    setSidebarCards(meetingCards);
	    setUnfilteredSidebarCards(meetingCards);
	        
	} else if (value === "all") {
	    setSidebarCards(mainCards);
	    setUnfilteredSidebarCards(mainCards);
	        
	} else if (value === "read") {
	    const readCards = cards.filter(card => card.card_id.startsWith('READ'));
	    setSidebarCards(readCards);
	    setUnfilteredSidebarCards(readCards);
	} else if (value === "work") {
	    const workCards = cards.filter(card => card.card_id.startsWith('SP') || card.card_id.startsWith('SYMP')).filter(card => !card.card_id.includes('/'));
	    setSidebarCards(workCards);
	    setUnfilteredSidebarCards(workCards);
	} else if (value === "unsorted") {
	    const unsortedCards = cards.filter(card => card.card_id === "");
	    setSidebarCards(unsortedCards);
	    setUnfilteredSidebarCards(unsortedCards);
	}

    }
    
    async function handleViewBacklink(backlink) {
	// Assuming backlink is an object with id and title, you can just use the id to view the card.
	const cardData = await getCard(backlink.id)
	if ('error' in cardData) {
	    setError(cardData["error"]);
	} else {

	    if ('id' in cardData.parent) {
		let parentCardId = cardData.parent.id;
		const parentCard = await getCard(parentCardId);
		setParentCard(parentCard);
	    } else {
		setParentCard(null);
	    }
	    handleViewCard(cardData);
	}
    }
    async function handleSidebarCardClick(card) {
	// Call getCard with the card's id and then call handleViewCard with the fetched cardData
	if ('id' in card.parent) {
	    let parentCardId = card.parent.id;
	    const parentCard = await getCard(parentCardId);
	    setParentCard(parentCard);
	} else {
	    setParentCard(null);
	}
	const cardData = await getCard(card.id)
	handleViewCard(cardData);
    }


    function renderCardText(card) {
	const body = card.body;
	const parts = body.split(/(\[[A-Za-z0-9_.-/]+\])|(\n)/);
	return parts.map((part, i) => {
	    // If part is a new line character, return a break element
	    if (part === "\n") {
		return <br key={i} />;
	    }
	    // If part is a bracketed word, render a link
	    else if (part && part.startsWith("[") && part.endsWith("]")) {
		const cardId = part.substring(1, part.length - 1);
		const id = getIdByCardId(cardId);
		
		const linkedCard = card.direct_links.find(linked => linked.card_id === cardId);
		const title = linkedCard ? linkedCard.title : "Card not found";
		return (
		        <a
		    key={i}
		    title={title}
		    href="#"
		    onClick={(e) => {
			e.preventDefault();
				handleViewBacklink({"id": id, "card_id": cardId
					   });
		    }}
		    style={{ fontWeight: 'bold', color: 'blue' }}
		        >
			    {part
			    }
			</a>
		);
	    }
	    // Otherwise, just render the text
	    return part;
	});
    }

    // Render the warning label
    const renderWarningLabel = () => {
	if (!editingCard.card_id) return null;
	if (!isCardIdUnique(editingCard.card_id)) {
	    return <span style={{ color: 'red' 
				}
			       }>Card ID is not unique!</span>;
	}
	return null;
    };

    async function setAllCards() {
	fetchCards()
	    .then(data => {
		setCards(data);
	    	let filtered = data.filter(card => !card.card_id.includes('/'))
		    .filter(card => !card.card_id.startsWith('REF'))
		    .filter(card => !card.card_id.startsWith('SP'))
		    .filter(card => !card.card_id.startsWith('SM'))
		    .filter(card => !card.card_id.startsWith('READ'));
		setMainCards(filtered);
		return filtered
	    })
	    .then(data => {
		setSidebarCards(data);
		setUnfilteredSidebarCards(data);
	    });
    }

    useEffect(() => {
	setAllCards();
	
    }, []);

    return (
	<div>
	    <button className="hamburger" onClick={toggleSidebar}>☰</button>
	    <div className={`sidebar ${isSidebarHidden ? 'sidebar-hidden' : ''}`}>
		<button className="sidebar-button" onClick={handleNewCard}>New Card</button>
		<input type="text" value={filter} onChange={handleFilter} placeholder="Filter" />
		<button className="icon-button" onClick={handleOpenSearch}>Search</button>
		<select onChange={handleSelectChange}>
		    <option value="all">All Cards</option>
		    <option value="meeting">Meeting Cards</option>
		    <option value="read">Read Cards</option>
		    <option value="reference">Reference Cards</option>
		    <option value="unsorted">Unsorted Cards</option>
		    <option value="work">Work Cards</option>
		</select>
		<select onChange={handleSortChange}>
		    <option value="sortSmallBig">Sort Big to Small</option>
		    <option value="sortBigSmall">Sort Small to Big</option>
		    <option value="sortNewOld">Sort New to Old</option>
		    <option value="sortOldNew">Sort Old to New</option>
		</select>
		<div className="scroll-cards">
		    <div>
			{sidebarCards.map(card => (
			    <div key={card.id} onClick={() => handleSidebarCardClick(card)}>
				<span style={{ color: 'blue', fontWeight: 'bold' }}>
				    {card.card_id}
				</span>			    
				: {card.title}
			    </div>
			))}
		    </div>
		</div>
	    </div>
	    <div className="main-content" style={{ width: '80%', float: 'left', padding: '20px', height: '100vh' }}>
		{error && (
		    <div>
			<p>Error: {error}</p>
		    </div>
		)}
		{searchCard && (
		    <div>
			<input
			    style={{ display: 'block', width: '100%', marginBottom: '10px' }} // Updated style here
			    type="text"
			    id="title"
			    value={searchTerm}
			    placeholder="Search"
			    onChange={handleSearch}
			/>
			<button onClick={handleSaveCard}>Search</button>
			<ul>
			    {cards.filter(card => card.title.toLowerCase().includes(searchTerm) || card.body.toLowerCase().includes(searchTerm))
			     .map((card, index) => (
				 
				 <li key={index} style={{ marginBottom: '10px' }}>
				     <a
					 href="#"
					 onClick={(e) => {
					     e.preventDefault();
					     handleViewCard(card);
					 }}
					 style={{ color: 'black', textDecoration: 'none' }}
				     >
					 <span style={{ color: 'blue', fontWeight: 'bold' }}>
					     {card.card_id}
					 </span>: {card.title}<br /><br />
					 <span>{card.body}</span>
				     </a>
				 </li>
			     ))}
			</ul>
		    </div>
		)}
		{viewingCard && (
		    <div>
			<h2 style={{ marginBottom: '10px' }}>
			    <span style={{ fontWeight: 'bold', color: 'blue' }}>
				{viewingCard.card_id} 
			    </span>
			    <span>
				: {viewingCard.title}
			    </span>
			</h2>
			<hr />
			<div style={{ marginBottom: '10px' }}>
			    {renderCardText(viewingCard)}
			</div>
			<div>
			    {viewingCard.is_reference && <>
				<span style={{ fontWeight: 'bold' }}>
				    Link: 
				</span>
				<span>
				    {viewingCard.link}
				</span>
			    </>}
			</div>
			<hr />
			<p>
			    Created At: {viewingCard.created_at}
			</p>
			<p>
			    Updated At: {viewingCard.updated_at}
			</p>
			<hr />
			{parentCard && (
			    <div>
			    <h4>Parent:</h4>
			    <ul>
				<li style={{ marginBottom: '10px' }}>
				    <a
					href="#"
					onClick={(e) => {
					    e.preventDefault();
					    handleViewCard(parentCard);
					}}
					style={{ color: 'black', textDecoration: 'none' }}
				    >
					<span style={{ color: 'blue', fontWeight: 'bold' }}>
					    {parentCard.card_id}
					</span>: {parentCard.title}
				    </a>
				</li>
			    </ul>
			    </div>
			)}
			<h4>Backlinks:</h4>
			<ul>
			    {viewingCard.backlinks.map((backlink, index) => (
				<li key={index} style={{ marginBottom: '10px' }}>
				    <a
				        href="#"
					onClick={(e) => {
					    e.preventDefault();
					    handleViewBacklink(backlink);
					                            
					}}
					style={{ color: 'black', textDecoration: 'none' }}
				    >
					<span style={{ color: 'blue', fontWeight: 'bold' }}>
					    {backlink.card_id}
					</span>: {backlink.title}
				    </a>
				</li>
				            
			    ))}
			</ul>
			<button onClick={handleEditCard}>Edit</button>
			 <h4>Children:</h4>
			<ul>
			    {cards.filter(card => card.card_id.startsWith(`${viewingCard.card_id}/`) || card.card_id.startsWith(`${viewingCard.card_id}.`))
			     .sort((a, b) => a.card_id.localeCompare(b.card_id))
			     .map((childCard, index) => (
				<li key={index} style={{ marginBottom: '10px' }}>
				    <a
					href="#"
					onClick={(e) => {
					    e.preventDefault();
					    handleViewCard(childCard);
					}}
					style={{ color: 'black', textDecoration: 'none' }}
				    >
					<span style={{ color: 'blue', fontWeight: 'bold' }}>
					    {childCard.card_id}
					</span>: {childCard.title}
				    </a>
				</li>
			    ))}
			</ul>
		    </div>
		    
		)}


		{editingCard && (
		    <div>
			<label htmlFor="title">Card ID:</label>
			<div style={{ display: 'flex'}}>
			    <input
				type="text"
				value={editingCard.card_id}
				onChange={e => setEditingCard({ ...editingCard, card_id: e.target.value })}
				onBlur={() => setInputBlurred(true)}
				placeholder="ID"
				style={{ display: 'block', marginBottom: '10px' }} // Added styles here
			    />
			    {inputBlurred && renderWarningLabel()}
			</div>
			{/* Title Section */}
			<label htmlFor="title">Title:</label>
			<input
			    style={{ display: 'block', width: '100%', marginBottom: '10px' }} // Updated style here
			    type="text"
			    id="title"
			    value={editingCard.title}
			    onChange={e => setEditingCard({ ...editingCard, title: e.target.value })}
			    placeholder="Title"
			/>
			
			{/* Body Section */}
			<label htmlFor="body">Body:</label>
			<textarea
			    style={{ display: 'block', width: '100%', height: '200px' }} // Updated style here
			    id="body"
			    value={editingCard.body}
			    onChange={e => setEditingCard({ ...editingCard, body: e.target.value })}
			    placeholder="Body"
			/>
			
			<label htmlFor="title">Is Reference:</label>
			<input
			    type="checkbox"
			    id="is_reference"
			    checked={editingCard.is_reference}
			    onChange={e => setEditingCard({ ...editingCard, is_reference: e.target.checked })}
			    style={{ marginBottom: '10px' }} // Updated style here
			/>
			<label htmlFor="title">Link:</label>
			<input
			    style={{ display: 'block', width: '100%', marginBottom: '10px' }} // Updated style here
			    type="text"
			    id="link"
			    value={editingCard.link}
			    onChange={e => setEditingCard({ ...editingCard, link: e.target.value })}
			    placeholder="Title"
			/>
			<button onClick={handleSaveCard}>Save</button>
		    </div>
		)}
	    </div>
	</div>
    );
}

export default App;
