import React, { useState, useEffect } from "react";
import "../App.css";
import { getCard, saveNewCard, saveExistingCard, getNextId } from "../api";
import { SearchPage } from "../components/SearchPage";
import { SettingsPage } from "../components/SettingsPage";
import { FileVault } from "../components/FileVault";
import { ViewPage } from "../components/ViewPage";
import { EditPage } from "../components/EditPage";
import { Sidebar } from "../components/Sidebar";
import { Topbar } from "../components/Topbar";
import { useAuth } from "../AuthContext";
import { useNavigate } from "react-router-dom";
import { BrowserRouter as Router, Route, Routes, Link, Outlet } from 'react-router-dom';

function MainApp() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [cards, setCards] = useState([]);
  const [newCard, setNewCard] = useState(null);
  const [viewingCard, setViewCard] = useState(null);
  const [viewFileVault, setViewFileVault] = useState(null);
  const [viewSettings, setViewSettings] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [searchCard, setSearchCard] = useState(null);
  const [lastCardId, setLastCardId] = useState("");
  const [refreshSidebar, setRefreshSidebar] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCards, setSearchCards] = useState([]);
  const { isAuthenticated, logoutUser } = useAuth();

  // changing pages

  function changePage() {
    setError(null);
    setViewCard(null);
    setLastCardId(null);
    setEditingCard(null);
    setSearchCard(null);
    setNewCard(null);
    setViewSettings(null);
    setViewFileVault(null);
  }

  async function handleNewCard(cardType) {
    changePage();
    setNewCard(true);
    let nextId;
    if (cardType === "reference" || cardType === "meeting") {
	let response = await getNextId(cardType);
	nextId = response["new_id"]
    } else {
      nextId = lastCardId;
    }

      navigate("/app/card/new")
    setEditingCard({ card_id: nextId, title: "", body: "" });
    document.title = "Zettelkasten - New Card";
  }
  function handleViewFileVault() {
    changePage();
      navigate("/app/files");
  }
  function handleViewSettings() {
    changePage();
      navigate("/app/settings");
  }
  function handleIndexClick() {
    changePage();
  }

  async function handleViewCard(card) {
    changePage();
    document.title = "Zettelkasten - " + card.card_id + " - " + card.title;
  }


  function handleDeleteCard() {
    changePage();
    setEditingCard(null);
    setRefreshSidebar(true);
  }

  useEffect(() => {
    // Check if token does not exist or user is not authenticated
    if (!localStorage.getItem("token")) {
      logoutUser(); // Call your logout function
      navigate("/login"); // Redirect to the login page
    }
  }, [isAuthenticated]); // Dependency array, rerun effect if isAuthenticated changes

    function Test () {
	useEffect(() => {
	    console.log("asdasd")
	});
	return (<div>hi</div>)
    };
  return (
    <div>
	<Topbar
        handleNewCard={handleNewCard}
        handleViewFileVault={handleViewFileVault}
        handleViewSettings={handleViewSettings}
        handleIndexClick={handleIndexClick}
      />
      <div className="main-content">
        <Sidebar
          cards={cards}
          setCards={setCards}
          refreshSidebar={refreshSidebar}
          setRefreshSidebar={setRefreshSidebar}
        />
        <div className="content">
          {error && (
            <div>
              <p>Error: {error}</p>
            </div>
          )}

	    <Routes>
		<Route path="search" element={
            <SearchPage
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              cards={searchCards}
              setCards={setSearchCards}
            />

		       } />
		<Route path="card/:id" element={

			   <ViewPage
			       cards={cards}
			       setLastCardId={setLastCardId}
			   />
		       } />
		<Route path="card/:id/edit" element={
			   <EditPage
			       cards={cards}
			       newCard={newCard}
			       handleDeleteCard={handleDeleteCard}
			       setRefreshSidebar={setRefreshSidebar}
			   />
		   
		       }/>

		<Route path="card/new" element={
			   <EditPage
			       cards={cards}
			       newCard={true}
			       handleDeleteCard={handleDeleteCard}
			       setRefreshSidebar={setRefreshSidebar}
			       lastCardId={lastCardId}
			   />
		   
		       }/>
		<Route path="settings" element={<SettingsPage />}/>
		<Route path="files" element={<FileVault />}/>
	    </Routes>
        </div>
      </div>
    </div>
  );
}

export default MainApp;
