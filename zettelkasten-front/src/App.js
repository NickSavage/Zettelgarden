
import React, { useState, useEffect } from 'react';

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

    function handleEditCard() {
	setEditingCard(viewingCard);
	setViewingCard(null);
	  
    }

    function handleSaveCard() {
	const url = newCard ?
	      `http://192.168.0.72:5000/cards`:
	`http://192.168.0.72:5000/cards/${editingCard.id}` ;
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
    
    const filteredCards = cards.filter(
	card => card.id.includes(search) || card.title.includes(search)
	  
    );

    return (
	<div>
	    <div style={{ width: '20%', float: 'left', borderRight: '1px solid #ccc' }}>
		<button onClick={handleNewCard}>New Card</button>
		<input type="text" value={search} onChange={handleSearch} placeholder="Search" />
		<div>
		    {filteredCards.map(card => (
			<div key={card.id} onClick={() => handleViewCard(card)}>
			    {card.id}: {card.title}
			</div>
			          
		    ))}
		</div>
	    </div>
	    <div style={{ width: '80%', float: 'left', padding: '20px' }}>
		{viewingCard && (
		    <div>
			<h2>{viewingCard.id}</h2>
			<h3>{viewingCard.title}</h3>
			<p>{viewingCard.body}</p>
			<h4>Backlinks:</h4>
			<ul>
			    {viewingCard.backlinks.map((link, index) => (
				<li key={index}>{link}</li>
				              
			    ))}
			</ul>
			<button onClick={handleEditCard}>Edit</button>
		    </div>
		            
		)}
		{editingCard && (
		    <div>
			<input
			    type="text"
			    value={editingCard.id}
			    onChange={e => setEditingCard({ ...editingCard, id: e.target.value }
							 )}
			    placeholder="ID"
			/>
			<input
			    type="text"
			    value={editingCard.title}
			    onChange={e => setEditingCard({ ...editingCard, title: e.target.value }
							 )
				     }
			    placeholder="Title"
			/>
			<textarea
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
