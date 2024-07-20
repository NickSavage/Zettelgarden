import React, { useState, useEffect, ChangeEvent, useMemo } from "react";
import { CardItem } from "./cards/CardItem";
import { Link } from "react-router-dom";
import { useTaskContext } from "../contexts/TaskContext";
import { isTodayOrPast } from "../utils/dates";
import { usePartialCardContext } from "../contexts/CardContext";
import { CreateTaskWindow } from "./tasks/CreateTaskWindow";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { FilterInput } from "./FilterInput";

export function Sidebar() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");
  const { partialCards } = usePartialCardContext();
  const { tasks } = useTaskContext();
  const username = localStorage.getItem("username");
  const [isNewDropdownOpen, setIsNewDropdownOpen] = useState(false);
  const [showCreateTaskWindow, setShowCreateTaskWindow] =
    useState<boolean>(false);

  const mainCards = useMemo(
    () => partialCards.filter((card) => !card.card_id.includes("/")),
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

  function handleNewStandardCard() {
    navigate("/app/card/new", { state: { cardType: "standard" } });
  }
  function handleNewTask() {
    setShowCreateTaskWindow(true);
  }

  const toggleNewDropdown = () => {
    console.log("?");
    setIsNewDropdownOpen(!isNewDropdownOpen);
    console.log(isNewDropdownOpen);
  };

  const todayTasks = useMemo(
    () =>
      tasks.filter(
        (task) => !task.is_complete && isTodayOrPast(task.scheduled_date)
      ),
    [tasks]
  );

  function handleFilter(text: string) {
    setFilter(text);
  }

  return (
    <div className="sidebar">
      <div className="sidebar-upper">
        <Link to="/">
          <img src={logo} alt="Company Logo" className="logo" />
        </Link>
        <Link to="/app/settings">
          <span className="sidebar-upper-username">{username}</span>
        </Link>
        <div className="dropdown">
          <button className="btn" onClick={toggleNewDropdown}>
            +
          </button>
          {isNewDropdownOpen && (
            <div className="dropdown-content">
              <a href="#settings" onClick={handleNewStandardCard}>
                New Card
              </a>
              <a href="#task" onClick={handleNewTask}>
                New Task
              </a>
            </div>
          )}
        </div>
      </div>
      <div>
        <div className="sidebar-links">
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
            <li className="sidebar-nav-item">
              <Link className="sidebar-nav-link" to="/app/files">
                Files
              </Link>
            </li>
          </ul>
        </div>
        <FilterInput handleFilterHook={handleFilter} />
      </div>
      <div className="scroll-cards">
        <div>
          {filteredCards.map((card) => (
            <CardItem key={card.id} card={card} />
          ))}
        </div>
      </div>
      <div>
        {showCreateTaskWindow && (
          <CreateTaskWindow
            currentCard={null}
            setRefresh={(refresh: boolean) => {}}
            setShowTaskWindow={setShowCreateTaskWindow}
          />
        )}
      </div>
    </div>
  );
}
