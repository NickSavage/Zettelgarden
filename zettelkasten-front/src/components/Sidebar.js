import { useState, useEffect } from "react";
import { fetchPartialCards } from "../api";
import { sortCards } from "../utils";
import { CardItem } from "./CardItem";
import { useNavigate } from "react-router-dom";

export function Sidebar({
  cards,
  setCards,
  refreshSidebar,
  setRefreshSidebar,
}) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [mainCards, setMainCards] = useState([]);
  const [sidebarCards, setSidebarCards] = useState([]);
  const [unfilteredSidebarCards, setUnfilteredSidebarCards] = useState([]);
  const [sidebarView, setSidebarView] = useState("all");

  const toggleSidebar = () => {
    setIsSidebarHidden(!isSidebarHidden);
  };

  const handleSortChange = (event) => {
    const value = event.target.value;
    let temp = sortCards(sidebarCards, value);
    setSidebarCards(temp);
  };

  function handleSelectChange(event) {
    const value = event.target.value;
    setSidebarView(value);
  }

  function changeSidebarView(cards, value) {
    setFilter("");
    if (value === "reference") {
      const referenceCards = cards.filter((card) =>
        card.card_id.startsWith("REF"),
      );
      setSidebarCards(referenceCards);
      setUnfilteredSidebarCards(referenceCards);
    } else if (value === "meeting") {
      const meetingCards = cards.filter(
        (card) =>
          card.card_id.startsWith("SM") || card.card_id.startsWith("MM"),
      );
      setSidebarCards(meetingCards);
      setUnfilteredSidebarCards(meetingCards);
    } else if (value === "all") {
      setSidebarCards(mainCards);
      setUnfilteredSidebarCards(mainCards);
    } else if (value === "unsorted") {
      const unsortedCards = cards.filter((card) => card.card_id === "");
      setSidebarCards(unsortedCards);
      setUnfilteredSidebarCards(unsortedCards);
    }
  }

  function handleFilter(e) {
    let filter = e.target.value;
      let isIdSearch = filter.startsWith('!');
    setFilter(filter);

    document.getElementById("select-filters").value = "all";

    const filteredCards = mainCards.filter((card) => {
     if (isIdSearch) {
	 return card.card_id.toLowerCase().includes(filter.slice(1).trim().toLowerCase());
     } else {

	 // Check if any of the search terms are present in the card title or ID
	 return filter.split(" ").every((keyword) => {
             return (
		 keyword.trim().toLowerCase() === "" ||
		     card.title.toLowerCase().includes(keyword.trim().toLowerCase()) ||
		     card.card_id.toLowerCase().includes(keyword.trim().toLowerCase())
             );
	 });
     }
    });
    setSidebarCards(filteredCards);
  }

  async function setAllCards() {
    await fetchPartialCards()
      .then((data) => {
        setCards(data);
        let filtered = data.filter((card) => !card.card_id.includes("/"));
        setMainCards(filtered);
        return filtered;
      })
      .then((data) => {
        changeSidebarView(sidebarView);
      });
  }

  useEffect(() => {
    setAllCards();
  }, [refreshSidebar]);

  useEffect(() => {
    changeSidebarView(cards, sidebarView);
    setRefreshSidebar(false);
  }, [cards, sidebarView]);

  return (
    <div className={`sidebar ${isSidebarHidden ? "sidebar-hidden" : ""}`}>
      <div>
        <input
          type="text"
          value={filter}
          onChange={handleFilter}
          placeholder="Filter"
        />
      </div>
      <select onChange={handleSelectChange} id="select-filters">
        <option value="all">All Cards</option>
        <option value="meeting">Meeting Cards</option>
        <option value="reference">Reference Cards</option>
        <option value="unsorted">Unsorted Cards</option>
      </select>
      <select onChange={handleSortChange}>
        <option value="sortSmallBig">Sort Big to Small</option>
        <option value="sortBigSmall">Sort Small to Big</option>
        <option value="sortNewOld">Sort New to Old</option>
        <option value="sortOldNew">Sort Old to New</option>
      </select>
      <div className="scroll-cards">
        <div>
          {sidebarCards.map((card) => (
            <CardItem key={card.id} card={card} />
          ))}
        </div>
      </div>
    </div>
  );
}
