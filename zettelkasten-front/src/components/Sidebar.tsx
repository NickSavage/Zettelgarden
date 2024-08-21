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

export function Sidebar() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("");
  const { partialCards } = usePartialCardContext();
  const { tasks } = useTaskContext();
  const username = localStorage.getItem("username");
  const [isNewDropdownOpen, setIsNewDropdownOpen] = useState(false);
  const {
    showCreateTaskWindow,
    setShowCreateTaskWindow,
    showQuickSearchWindow,
    setShowQuickSearchWindow,
  } = useShortcutContext();
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
        (task) => !task.is_complete && isTodayOrPast(task.scheduled_date)
      ),
    [tasks]
  );

  function handleFilter(text: string) {
    setFilter(text);
  }

  const handleKeyPress = (event) => {
    // if this is true, the user is using a system shortcut, don't do anything with it
    if (event.metaKey) {
      return;
    }
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
        <div className="sidebar-links">
          <ul>
            <SidebarLink
              to="/app/tasks"
              children={[
                <span className="mr-2">
                  <TasksIcon />
                </span>,
                <span className="flex-grow">Tasks</span>,
                <span className="sidebar-nav-badge">{todayTasks.length}</span>,
              ]}
            />
            <SidebarLink
              to="/app/search"
              children={[
                <span className="mr-2">
                  <SearchIcon />
                </span>,
                <span className="flex-grow">Search</span>,
              ]}
            />
            <SidebarLink
              to="/app/files"
              children={[
                <span className="mr-2">
                  <FileIcon />
                </span>,
                <span className="flex-grow">Files</span>,
              ]}
            />
          </ul>
        </div>
      </div>
      <div className="scroll-cards">
        <FilterInput handleFilterHook={handleFilter} />
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
