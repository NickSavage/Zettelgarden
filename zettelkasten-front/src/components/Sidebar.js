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
  const [filteredCards, setFilteredCards] = useState([]);
  const [sidebarView, setSidebarView] = useState("all");

  function handleFilter(e) {
    let filter = e.target.value;
    let isIdSearch = filter.startsWith('!');
    setFilter(filter);

    const filtered = mainCards.filter((card) => {
        let cardId = card.card_id.toString().toLowerCase(); // Ensure card_id is treated as a string
        let title = card.title.toLowerCase();

        if (isIdSearch) {
            // Search only by card_id, remove the leading '!' and trim whitespace
            return cardId.startsWith(filter.slice(1).trim().toLowerCase());
        } else {
            // Split filter into keywords and check each keyword in title or card_id
            return filter.split(" ").every((keyword) => {
                let cleanKeyword = keyword.trim().toLowerCase();
                return (
                    cleanKeyword === "" ||
                    title.includes(cleanKeyword) ||
                    cardId.includes(cleanKeyword)
                );
            });
        }
    });
    
    setFilteredCards(filtered);
}


  async function setAllCards() {
    await fetchPartialCards("", "date")
      .then((data) => {
        setCards(data);
        let filtered = data.filter((card) => !card.card_id.includes("/"));
        setMainCards(filtered);
        setFilteredCards(filtered);
        return filtered;
      });
  }

  useEffect(() => {
    setAllCards();
  }, [refreshSidebar]);

  useEffect(() => {
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
      <div className="scroll-cards">
        <div>
          {filteredCards.map((card) => (
            <CardItem key={card.id} card={card} />
          ))}
        </div>
      </div>
    </div>
  );
}
