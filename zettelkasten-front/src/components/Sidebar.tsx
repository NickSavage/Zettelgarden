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
import { SidebarLink } from "./SidebarLink";
import { SearchIcon } from "../assets/icons/SearchIcon";
import { TasksIcon } from "../assets/icons/TasksIcon";
import { FileIcon } from "../assets/icons/FileIcon";
import { Button } from "./Button";

import { useShortcutContext } from "../contexts/ShortcutContext";
import { QuickSearchWindow } from "./cards/QuickSearchWindow";

import { PartialCard } from "../models/Card";
import { fetchPartialCards } from "../api/cards";

export function Sidebar() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");
  const { partialCards } = usePartialCardContext();
  const { tasks } = useTaskContext();
  const username = localStorage.getItem("username");
  const [isNewDropdownOpen, setIsNewDropdownOpen] = useState(false);
  const [filteredCards, setFilteredCards] = useState<PartialCard[]>([]);
  const {
    showCreateTaskWindow,
    setShowCreateTaskWindow,
    showQuickSearchWindow,
    setShowQuickSearchWindow,
  } = useShortcutContext();

  const mainCards = useMemo(
    () => partialCards.filter((card) => !card.card_id.includes("/")),
    [partialCards],
  );

  useEffect(() => {
    setFilteredCards(mainCards.slice(0, 100));
  }, [mainCards]);

  function handleNewStandardCard() {
    toggleNewDropdown();
    navigate("/app/card/new", { state: { cardType: "standard" } });
  }
  function handleNewTask() {
    toggleNewDropdown();
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
        (task) => !task.is_complete && isTodayOrPast(task.scheduled_date),
      ),
    [tasks],
  );

  async function handleFilter(text: string) {
    setFilter(text);
    if (text == "") {
      setFilteredCards(mainCards.slice(0, 100));
    }
    await fetchPartialCards(text, "date").then((data) => {
      setFilteredCards(data.filter((card => !card.card_id.includes("/"))));
    });
  }

  const handleKeyPress = (event: KeyboardEvent) => {
    // if this is true, the user is using a system shortcut, don't do anything with it
    if (event.metaKey) {
      return;
    }

    // these should only work if there isn't an input selected
    const focusedElement = document.activeElement;
    if (!focusedElement || !focusedElement.tagName.match(/^INPUT|TEXTAREA$/i)) {
      if (event.key === "c") {
        navigate("/app/card/new", { state: { cardType: "standard" } });
      }
      if (event.key === "t") {
        event.preventDefault();
        setShowQuickSearchWindow(false);
        setShowCreateTaskWindow(true);
      }
      if (event.key === "s") {
        event.preventDefault();
        setShowCreateTaskWindow(false);
        setShowQuickSearchWindow(true);
      }
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, []);

  return (
    <div className="sidebar">
      <div className="sidebar-upper">
        <Link to="/">
          <img src={logo} alt="Company Logo" className="logo rounded-md" />
        </Link>
        <div className="grow">
          <Link to="/app/settings">
            <span className="sidebar-upper-username">{username}</span>
          </Link>
        </div>
        <div className="dropdown">
          <Button onClick={toggleNewDropdown} children="+" />
          {isNewDropdownOpen && (
            <div className="popup-menu">
              <button onClick={handleNewStandardCard} children={"New Card"} />
              <button onClick={handleNewTask} children={"New Task"} />
            </div>
          )}
        </div>
      </div>
      <div>
        <div className="sidebar-links p-2">
          <ul>
            <SidebarLink
              to="/app/search"
              children={[
                <span className="mx-2">
                  <SearchIcon />
                </span>,
                <span className="flex-grow">Cards</span>,
              ]}
            />
            <SidebarLink
              to="/app/tasks"
              children={[
                <span className="mx-2">
                  <TasksIcon />
                </span>,
                <span className="flex-grow">Tasks</span>,
                <span className="sidebar-nav-badge">{todayTasks.length}</span>,
              ]}
            />
            <SidebarLink
              to="/app/files"
              children={[
                <span className="mx-2">
                  <FileIcon />
                </span>,
                <span className="flex-grow">Files</span>,
              ]}
            />
          </ul>
        </div>
      </div>
      <div className="scroll-cards">
        <span className="px-2.5 py-2 font-bold">Recent Cards</span>
        <div className="m-1">
          <FilterInput handleFilterHook={handleFilter} />
        </div>
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
      <div>
        {showQuickSearchWindow && (
          <QuickSearchWindow setShowWindow={setShowQuickSearchWindow} />
        )}
      </div>
    </div>
  );
}
