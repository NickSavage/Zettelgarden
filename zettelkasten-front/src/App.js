
import React, { useState, useEffect } from 'react';
import './App.css';
import {fetchCards, getCard, saveCard} from './api';
import {SearchPage} from './components/SearchPage'
import {ViewPage} from './components/ViewPage';
import {EditPage} from './components/EditPage';

function App() {
    const [error, setError] = useState("");
    const [cards, setCards] = useState([]);
    const [mainCards, setMainCards] = useState([]);
    const [sidebarCards, setSidebarCards] = useState([]);
    const [unfilteredSidebarCards, setUnfilteredSidebarCards] = useState([]);
    const [newCard, setNewCard]= useState(null);
    const [viewingCard, setViewCard] = useState(null);
    const [parentCard, setParentCard] = useState(null);
    const [editingCard, setEditingCard] = useState(null);
    const [searchCard, setSearchCard] = useState(null);
    const [filter, setFilter] = useState('');
    const [isSidebarHidden, setIsSidebarHidden] = useState(false);
    const [lastCardId, setLastCardId] = useState('');

    const toggleSidebar = () => {
	setIsSidebarHidden(!isSidebarHidden);
    };

    const base_url = process.env.REACT_APP_URL;

    async function handleSaveCard() {
	const url = newCard ?
	      base_url + `/cards`:
	      base_url + `/cards/${encodeURIComponent(editingCard.id)}` ;
	const method = newCard ? 'POST' : 'PUT';
	
	let card = editingCard;
	
	saveCard(url, method, card)
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

    function handleFilter(e) {
	let filter = e.target.value;
	setFilter(filter);
	  
	const filteredCards = unfilteredSidebarCards.filter(
	    card => card.card_id.toLowerCase().includes(filter) || card.title.toLowerCase().includes(filter)
	);
	setSidebarCards(filteredCards);
    }
    // changing pages

    function changePage() {
	setError(null);
	setViewCard(null);
	setLastCardId(null);
	setEditingCard(null);
	setSearchCard(null);
	setNewCard(null);
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

    async function handleViewCard(card) {
	changePage();
	document.title = "Zettelkasten - " + card.card_id + " - "+ card.title;
	setViewCard(card);
	setLastCardId(card.card_id)
	if ('id' in card.parent) {
	    let parentCardId = card.parent.id;
	    const parentCard = await getCard(parentCardId);
	    setParentCard(parentCard);
	} else {
	    setParentCard(null);
	}
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
	    handleViewCard(cardData);
	}
    }
    async function handleSidebarCardClick(card) {
	// Call getCard with the card's id and then call handleViewCard with the fetched cardData
	const cardData = await getCard(card.id)
	handleViewCard(cardData);
    }


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
		    <SearchPage
			cards={cards}
			handleViewCard={handleViewCard}
		    />
		)}
		{viewingCard && (

		    <ViewPage
			viewingCard={viewingCard}
			cards={cards}
			handleViewBacklink={handleViewBacklink}
			parentCard={parentCard}
			handleViewCard={handleViewCard}
			handleEditCard={handleEditCard}
		    />
		)}

		{editingCard && (
			<EditPage
			    cards={cards}
			    editingCard={editingCard}
			    setEditingCard={setEditingCard}
			    handleSaveCard={handleSaveCard}
			/>
		)}
	    </div>
	</div>
    );
}

export default App;
