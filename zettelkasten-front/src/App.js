
import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
    const [cards, setCards] = useState([]);
    const [newCard, setNewCard]= useState(null);
    const [viewingCard, setViewingCard] = useState(null);
    const [parentCard, setParentCard] = useState(null);
    const [editingCard, setEditingCard] = useState(null);
    const [search, setSearch] = useState('');
    const [viewReference, setViewReference] = useState(false);
    const [viewMeeting, setViewMeeting] = useState(false);
    const [viewRead, setViewRead] = useState(false);

    useEffect(() => {
	fetch('http://192.168.0.72:5000/cards')
	    .then(response => response.json())
	    .then(data => setCards(data));
	  
    }, []);

    function getCard(id) {
	// Assuming your backend is running on the same IP and port as in previous example
	let encoded = encodeURIComponent(id)
	console.log(encoded)
	const url = `http://192.168.0.72:5000/cards/${encoded}`;
	console.log(url)

	// Send a GET request to the URL
	return fetch(url)
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
    
    
    function handleSearch(e) {
	setSearch(e.target.value);
	  
    }

    function handleNewCard() {
	setNewCard(true);
	setEditingCard({ id: '', title: '', body: '' });
	setViewingCard(null);
	  
    }

    function handleViewCard(card) {
	setViewingCard(card);
	setEditingCard(null);
	  
    }

    const handleSelectChange = (event) => {
	const value = event.target.value;
	if (value === "reference") {
	    handleReferenceClick();
	        
	} else if (value === "meeting") {
	    handleMeetingClick();
	        
	} else if (value === "all") {
	    handleAllClick();
	        
	} else if (value === "read") {
	    handleReadClick();
	}
    }
    
    function handleReferenceClick() {
	setViewReference(true);
	setViewMeeting(false);
	setViewRead(false);
	setSearch('');
    }
    function handleMeetingClick() {
	setViewReference(false);
	setViewMeeting(true);
	setViewRead(false);
	setSearch('');
    }
    function handleReadClick() {
	setViewReference(false);
	setViewMeeting(false);
	setViewRead(true);
	setSearch('');
    }
    function handleAllClick() {
	setViewReference(false);
	setViewMeeting(false);
	setViewRead(false);
	setSearch('');
    }
    
    async function handleViewBacklink(backlink) {
	// Assuming backlink is an object with id and title, you can just use the id to view the card.
	const parentCard = await getCard(backlink.target_id.split('/')[0])
	setParentCard(parentCard);
	const cardData = await getCard(backlink.target_id)
	handleViewCard(cardData);
    }
    async function handleSidebarCardClick(card) {
	// Call getCard with the card's id and then call handleViewCard with the fetched cardData
	const parentCard = await getCard(card.id.split('/')[0])
	setParentCard(parentCard);
	const cardData = await getCard(card.id)
	handleViewCard(cardData);
    }

    function handleEditCard() {
	setEditingCard(viewingCard);
	setViewingCard(null);
	  
    }

    async function handleSaveCard() {
	const url = newCard ?
	      `http://192.168.0.72:5000/cards`:
	      `http://192.168.0.72:5000/cards/${encodeURIComponent(editingCard.id)}` ;
	const method = newCard ? 'POST' : 'PUT';

	let card = editingCard;
	let id = card.id

	fetch(url, {
	    method: method,
	    headers: {
		'Content-Type': 'application/json',
		        
	    },
	    body: JSON.stringify(card),
	        
	})
	    .then(response => response.json())
	    .then(response => {
		console.log(response)
		if (!("error" in response)) {
		    setEditingCard(null);
		    setNewCard(null);
		}
		fetch('http://192.168.0.72:5000/cards')
		    .then(response => response.json())
		    .then(data => setCards(data));
	    });
	card = await getCard(id);
	console.log(card)
	setViewingCard(card);
	
	
    }

    function renderCardText(body) {
	const parts = body.split(/(\[[A-Za-z0-9_.-/]+\])|(\n)/);
	return parts.map((part, i) => {
	    // If part is a new line character, return a break element
	    if (part === "\n") {
		return <br key={i
			       } />;
	    }
	    // If part is a bracketed word, render a link
	    else if (part && part.startsWith("[") && part.endsWith("]")) {
		const cardId = part.substring(1, part.length - 1);
		return (
		        <a
		    key={i}
		    href="#"
		    onClick={(e) => {
			e.preventDefault();
			handleViewBacklink({"target_id": cardId
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
    
    const mainCards = cards
	  .filter(card => !card.id.includes('/'))
	  .filter(card => !card.is_reference)
	  .filter(card => !card.id.startsWith('SM'));
    const filteredCards = mainCards.filter(
	card => card.id.toLowerCase().includes(search) || card.title.toLowerCase().includes(search)
	  
    );
    const referenceCards = cards.filter(card => card.is_reference);
    const filteredReference = referenceCards.filter(
	card => card.id.toLowerCase().includes(search) || card.title.toLowerCase().includes(search)
    );
    const meetingCards = cards.filter(card => card.id.startsWith('SM'));
    const filteredMeeting = meetingCards.filter(
	card => card.id.toLowerCase().includes(search) || card.title.toLowerCase().includes(search)
    );
    
    const readCards = cards.filter(card => card.id.startsWith('READ'));
    const filteredRead = readCards.filter(
	card => card.id.toLowerCase().includes(search) || card.title.toLowerCase().includes(search)
    );

    return (
	<div>
	    <div className="sidebar" style={{ width: '20%', float: 'left', borderRight: '1px solid #ccc', overflowY: 'auto' }}>
		<button onClick={handleNewCard}>New Card</button>
		<input type="text" value={search} onChange={handleSearch} placeholder="Search" />
		<select onChange={handleSelectChange}>
		    <option value="reference">Reference Cards</option>
		    <option value="meeting">Meeting Cards</option>
		    <option value="read">Read Cards</option>
		    <option value="all">All Cards</option>
		</select>
		<div class="scroll-cards">
		    {viewReference && (
			<div>
			    {filteredReference.map(card => (
				<div key={card.id} onClick={() => handleSidebarCardClick(card)}>
				    <span style={{ color: 'blue', fontWeight: 'bold' }}>
					{card.id}
				    </span>			    
				    : {card.title}
				</div>
			    ))}
			</div>
			
		    )}
		    {viewMeeting && (
			<div>
			    {filteredMeeting.map(card => (
				<div key={card.id} onClick={() => handleSidebarCardClick(card)}>
				    <span style={{ color: 'blue', fontWeight: 'bold' }}>
					{card.id}
				    </span>			    
				    : {card.title}
				</div>
			    ))}
			</div>
			
		    )}
		    {viewRead && (
			<div>
			    {filteredRead.map(card => (
				<div key={card.id} onClick={() => handleSidebarCardClick(card)}>
				    <span style={{ color: 'blue', fontWeight: 'bold' }}>
					{card.id}
				    </span>			    
				    : {card.title}
				</div>
			    ))}
			</div>
			
		    )}
		    {!viewReference && !viewMeeting && !viewRead &&(
			<div>
			    {filteredCards.map(card => (
				<div key={card.id} onClick={() => handleSidebarCardClick(card)}>
				    <span style={{ color: 'blue', fontWeight: 'bold' }}>
					{card.id}
				    </span>			    
				    : {card.title}
				</div>
				
			    ))}
			</div>
		    )}
		</div>
	    </div>
	    <div className="main-content" style={{ width: '80%', float: 'left', padding: '20px', height: '100vh' }}>
		{viewingCard && (
		    <div>
			<h2 style={{ marginBottom: '10px' }}>
			    <span style={{ fontWeight: 'bold', color: 'blue' }}>
				{viewingCard.id} 
			    </span>
			    <span>
				{viewingCard.title}
			    </span>
			</h2>
			<hr />
			<div style={{ marginBottom: '10px' }}>
			    {renderCardText(viewingCard.body)}
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
					{parentCard.id}
				    </span>: {parentCard.title}
				</a>
			    </li>
			</ul>
			<h4>Backlinks:</h4>
			<ul>
			    {console.log(viewingCard)}
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
					    {backlink.target_id}
					</span>: {backlink.title}
				    </a>
				</li>
				            
			    ))}
			</ul>
			<button onClick={handleEditCard}>Edit</button>
			 <h4>Children:</h4>
			<ul>
			    {cards.filter(card => card.id.startsWith(`${viewingCard.id}/`)).map((childCard, index) => (
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
					    {childCard.id}
					</span>: {childCard.title}
				    </a>
				</li>
			    ))}
			</ul>
		    </div>
		    
		)}


		{editingCard && (
		    <div>
			{newCard ? (
			// If it's a new card, render an input field for the ID
			    <input
				type="text"
				value={editingCard.id}
				onChange={e => setEditingCard({ ...editingCard, id: e.target.value })}
				placeholder="ID"
				style={{ display: 'block', marginBottom: '10px' }} // Added styles here
			    />
			) : (
			    // If it's an existing card, just display the ID
			    <div style={{ marginBottom: '10px' }}>ID: {editingCard.id}</div> // Added styles here
			)}
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
