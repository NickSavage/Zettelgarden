
import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
    const [cards, setCards] = useState([]);
    const [newCard, setNewCard]= useState(null);
    const [viewingCard, setViewingCard] = useState(null);
    const [editingCard, setEditingCard] = useState(null);
    const [search, setSearch] = useState('');

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
		setViewingCard(cardData);
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
    // ...

    async function handleViewBacklink(backlink) {
	// Assuming backlink is an object with id and title, you can just use the id to view the card.
	const cardData = await getCard(backlink.target_id)
	handleViewCard(cardData);
    }
    function handleSidebarCardClick(card) {
	// Call getCard with the card's id and then call handleViewCard with the fetched cardData
	getCard(card.id)
            .then(cardData => {
		handleViewCard(cardData);
            });
    }



    function handleEditCard() {
	setEditingCard(viewingCard);
	setViewingCard(null);
	  
    }

    function handleSaveCard() {
	const url = newCard ?
	      `http://192.168.0.72:5000/cards`:
	      `http://192.168.0.72:5000/cards/${encodeURIComponent(editingCard.id)}` ;
	const method = newCard ? 'POST' : 'PUT';

	console.log([newCard, url, method])
	fetch(url, {
	    method: method,
	    headers: {
		'Content-Type': 'application/json',
		        
	    },
	    body: JSON.stringify(editingCard),
	        
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
	
    }

    function renderCardText(body) {
	const parts = body.split(/(\[[A-Za-z0-9_.-]+\])/); // split the text by bracketed words
	return parts.map((part, i) => {
	    // If part is a bracketed word, render a link
	    if (part.startsWith("[") && part.endsWith("]")) {
		const cardId = part.substring(1, part.length - 1); // remove brackets to get cardId
		return (
		    <a
			key={i}
			href="#"
			onClick={(e) => {
			    e.preventDefault();
			    // call the function to handle viewing the card, passing the cardId
			    handleViewBacklink({"target_id": cardId});
			}}
			style={{ color: 'blue' }}
		    >
			{part}
		    </a>
		);
	    }
	    // Otherwise, just render the text
	    return part;
	});
    }
    
    const mainCards = cards.filter(card => !card.id.includes('/'));
    const filteredCards = mainCards.filter(
	card => card.id.includes(search) || card.title.includes(search)
	  
    );

    return (
	<div>
	    <div className="sidebar" style={{ width: '20%', float: 'left', borderRight: '1px solid #ccc', overflowY: 'auto' }}>
		<button onClick={handleNewCard}>New Card</button>
		<input type="text" value={search} onChange={handleSearch} placeholder="Search" />
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
	    </div>
	    <div className="main-content" style={{ width: '80%', float: 'left', padding: '20px', height: '100vh' }}>
		{viewingCard && (
		    <div>
			<h2 style={{ marginBottom: '10px' }}>
			    {viewingCard.id}  - {viewingCard.title}
			</h2>
			<div style={{ marginBottom: '10px' }}>
			    {renderCardText(viewingCard.body)}
			</div>
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
			
			<button onClick={handleSaveCard}>Save</button>
		    </div>
		)}


		
	    </div>
	</div>
    );
}

export default App;
