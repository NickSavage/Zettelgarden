import React, { useState, useEffect, ChangeEvent, useMemo } from "react";
import { CardItem } from "./cards/CardItem";
import { Link, useLocation } from "react-router-dom";
import { useTaskContext } from "../contexts/TaskContext";
import { useChatContext } from "../contexts/ChatContext";
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
import { ChatIcon } from "../assets/icons/ChatIcon";
import { MenuIcon } from "../assets/icons/MenuIcon";
import { Button } from "./Button";

import { getUserConversations } from "../api/chat";
import { ConversationSummary } from "../models/Chat";

import { useShortcutContext } from "../contexts/ShortcutContext";
import { QuickSearchWindow } from "./cards/QuickSearchWindow";

import { PartialCard, Card } from "../models/Card";
import { fetchPartialCards } from "../api/cards";

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const [filter, setFilter] = useState("");
  const { partialCards, lastCard } = usePartialCardContext();
  const { tasks } = useTaskContext();
  const username = localStorage.getItem("username");
  const [isNewDropdownOpen, setIsNewDropdownOpen] = useState(false);
  const [filteredCards, setFilteredCards] = useState<PartialCard[]>([]);
  const [chatConversations, setChatConversations] = useState<
    ConversationSummary[]
  >([]);
  const { setConversationId } = useChatContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

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

  function getCurrentCard(): PartialCard | Card | null {
    const location = useLocation();
    const currentPath = location.pathname;
    const isCardPage = /^\/app\/card\/\d+$/.test(currentPath);
    if (isCardPage) {
      return lastCard;
    }
    return null;
  }
  function handleNewStandardCard() {
    toggleNewDropdown();
    navigate("/app/card/new", { state: { cardType: "standard" } });
  }
  function handleNewChat() {
    toggleNewDropdown();
    setConversationId("");
    navigate("/");
    navigate("/app/chat");
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
      setFilteredCards(
        data === null ? [] : data.filter((card) => !card.card_id.includes("/")),
      );
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

  useEffect(() => {
    getUserConversations().then((conversations) => {
      setChatConversations(conversations);
    });
  }, []);
  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="md:hidden fixed top-4 left-4 z-[60] p-2 bg-white rounded-md shadow-md"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <MenuIcon />
      </button>

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-[45]"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
    fixed md:relative
    w-64
    min-w-[16rem]    // Add this to set minimum width
    max-w-[16rem]    // Add this to set maximum width
    flex-shrink-0    // Add this to prevent shrinking
    h-screen
    bg-white
    flex flex-col
    border-r
    transform
    ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
    md:translate-x-0
    transition-transform
    duration-300
    ease-in-out
    z-[50]
  `}
      >
        {/* Upper Section */}
        <div className="flex items-center p-4 border-b">
          <Link to="/app">
            <img
              src={logo}
              alt="Company Logo"
              className="h-8 w-auto rounded-md"
            />
          </Link>
          <div className="flex-grow mx-2">
            <Link to="/app/settings">
              <span className="text-sm font-medium hover:text-gray-700">
                {username}
              </span>
            </Link>
          </div>
          <div className="relative">
            <Button
              onClick={toggleNewDropdown}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-500 text-white hover:bg-blue-600"
            >
              +
            </Button>
            {isNewDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-[70] border">
                <button
                  onClick={handleNewStandardCard}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  New Card
                </button>
                <button
                  onClick={handleNewTask}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  New Task
                </button>
                <button
                  onClick={handleNewChat}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  New Chat
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <div className="p-2">
          <ul className="space-y-1">
            <SidebarLink to="/app/search">
              <span className="mx-2">
                <SearchIcon />
              </span>
              <span className="flex-grow">Cards</span>
            </SidebarLink>

            <SidebarLink to="/app/tasks">
              <span className="mx-2">
                <TasksIcon />
              </span>
              <span className="flex-grow">Tasks</span>
              <span className="px-2 py-1 text-xs bg-blue-100 rounded-full">
                {todayTasks.length}
              </span>
            </SidebarLink>

            <SidebarLink to="/app/files">
              <span className="mx-2">
                <FileIcon />
              </span>
              <span className="flex-grow">Files</span>
            </SidebarLink>

            {import.meta.env.VITE_FEATURE_CHAT === "true" && (
              <SidebarLink to="/app/chat">
                <span className="mx-2">
                  <ChatIcon />
                </span>
                <span className="flex-grow">Chat</span>
              </SidebarLink>
            )}
          </ul>
        </div>

        {/* Scrollable Content Section */}
        <div className="flex-grow overflow-y-auto">
          {currentPath === "/app/chat" ? (
            <div className="flex flex-col">
              <span className="px-2.5 py-2 font-bold text-sm">
                Recent Chats
              </span>
              {chatConversations.map((summary) => (
                <div key={summary.id} className="py-2 px-2.5 hover:bg-gray-100">
                  <Link to={`/app/chat?id=${summary.id}`}>
                    <span className="text-sm">{summary.title}</span>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="px-2.5 py-2 font-bold text-sm">
                Recent Cards
              </span>
              <div className="m-1">
                <FilterInput handleFilterHook={handleFilter} />
              </div>
              <div className="space-y-1">
                {filteredCards.map((card) => (
                  <CardItem key={card.id} card={card} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Modal Windows */}
      {showCreateTaskWindow && (
        <CreateTaskWindow
          currentCard={getCurrentCard()}
          setRefresh={(refresh: boolean) => {}}
          setShowTaskWindow={setShowCreateTaskWindow}
        />
      )}

      {showQuickSearchWindow && (
        <QuickSearchWindow setShowWindow={setShowQuickSearchWindow} />
      )}
    </>
  );
}
