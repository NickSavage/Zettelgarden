import { useState, useEffect } from "react";
import { fetchCards } from "../api";
import { sortCards } from "../utils";

export function Sidebar({
  cards,
  setCards,
  handleViewCard,
  refreshSidebar,
  setRefreshSidebar,
}) {
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
      const meetingCards = cards.filter((card) =>
        card.card_id.startsWith("SM"),
      );
      setSidebarCards(meetingCards);
      setUnfilteredSidebarCards(meetingCards);
    } else if (value === "all") {
      setSidebarCards(mainCards);
      setUnfilteredSidebarCards(mainCards);
    } else if (value === "read") {
      const readCards = cards.filter((card) => card.card_id.startsWith("READ"));
      setSidebarCards(readCards);
      setUnfilteredSidebarCards(readCards);
    } else if (value === "work") {
      const workCards = cards
        .filter(
          (card) =>
            card.card_id.startsWith("SP") || card.card_id.startsWith("SYMP"),
        )
        .filter((card) => !card.card_id.includes("/"));
      setSidebarCards(workCards);
      setUnfilteredSidebarCards(workCards);
    } else if (value === "unsorted") {
      const unsortedCards = cards.filter((card) => card.card_id === "");
      setSidebarCards(unsortedCards);
      setUnfilteredSidebarCards(unsortedCards);
    }
  }

  function handleFilter(e) {
    let filter = e.target.value;
    setFilter(filter);

    const filteredCards = unfilteredSidebarCards.filter(
      (card) =>
        card.card_id.toLowerCase().includes(filter) ||
        card.title.toLowerCase().includes(filter),
    );
    setSidebarCards(filteredCards);
  }

  async function setAllCards() {
    await fetchCards()
      .then((data) => {
        setCards(data);
        let filtered = data
          .filter((card) => !card.card_id.includes("/"))
          .filter((card) => !card.card_id.startsWith("REF"))
          .filter((card) => !card.card_id.startsWith("SP"))
          .filter((card) => !card.card_id.startsWith("SM"))
          .filter((card) => !card.card_id.startsWith("READ"));
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
          {sidebarCards.map((card) => (
            <div key={card.id} onClick={() => handleViewCard(card)}>
              <span style={{ color: "blue", fontWeight: "bold" }}>
                {card.card_id}
              </span>
              : {card.title}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
