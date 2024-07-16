import React, { useState, useEffect, ChangeEvent, useMemo } from "react";
import { CardItem } from "./CardItem";
import { PartialCard } from "../models/Card";
import { Link } from "react-router-dom";
import { useTaskContext } from "src/contexts/TaskContext";
import { isTodayOrPast } from "src/utils/dates";
import { usePartialCardContext } from "src/contexts/CardContext";

export function Sidebar() {
  const [filter, setFilter] = useState("");
  const { partialCards } = usePartialCardContext();
  const { tasks } = useTaskContext();

  const mainCards = useMemo(() => 
    partialCards.filter((card) => !card.card_id.includes("/")),
    [partialCards]
  );

  const filteredCards = useMemo(() => {
    const isIdSearch = filter.startsWith("!");
    return mainCards.filter((card) => {
      const cardId = card.card_id.toString().toLowerCase();
      const title = card.title.toLowerCase();
      if (isIdSearch) {
        return cardId.startsWith(filter.slice(1).trim().toLowerCase());
      } else {
        return filter.split(" ").every((keyword: string) => {
          const cleanKeyword = keyword.trim().toLowerCase();
          return (
            cleanKeyword === "" ||
            title.includes(cleanKeyword) ||
            cardId.includes(cleanKeyword)
          );
        });
      }
    });
  }, [mainCards, filter]);

  const todayTasks = useMemo(() => 
    tasks.filter((task) => !task.is_complete && isTodayOrPast(task.scheduled_date)),
    [tasks]
  );

  function handleFilter(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setFilter(e.target.value);
  }

  return (
    <div className="sidebar">
      <div>
        <div className="sidebar-upper">
          <ul>
            <li className="sidebar-nav-item">
              <Link className="sidebar-nav-link" to="/app/tasks">
                Tasks
                <span className="sidebar-nav-badge">{todayTasks.length}</span>
              </Link>
            </li>
            <li className="sidebar-nav-item">
              <Link className="sidebar-nav-link" to="/app/search">
                Search
              </Link>
            </li>
          </ul>
        </div>
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