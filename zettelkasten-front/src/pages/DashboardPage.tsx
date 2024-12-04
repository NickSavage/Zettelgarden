import React from "react";
import { fetchPartialCards, getCard } from "../api/cards";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { PartialCard, Card } from "../models/Card";
import { useTaskContext } from "../contexts/TaskContext";
import { usePartialCardContext } from "../contexts/CardContext";
import { CardList } from "../components/cards/CardList";
import { useAuth } from "../contexts/AuthContext";
import { CardBody } from "../components/cards/CardBody";
import { useNavigate } from "react-router-dom";
import { TasksIcon } from "../assets/icons/TasksIcon";

import { useShortcutContext } from "../contexts/ShortcutContext";

export function DashboardPage() {
  const { partialCards } = usePartialCardContext();
  const [refresh, setRefresh] = React.useState<boolean>(false);
  const { tasks, setRefreshTasks } = useTaskContext();
  const { currentUser } = useAuth();

  const { showCreateTaskWindow, setShowCreateTaskWindow } =
    useShortcutContext();

  const navigate = useNavigate();

  const [displayCard, setDisplayCard] = React.useState<Card | null>(null);

  async function fetchDisplayCard(cardPK: number) {
    await getCard(cardPK.toString()).then((card) => {
      setDisplayCard(card);
    });
  }

  function handleNewCard() {
    navigate("/app/card/new", { state: { cardType: "standard" } });
  }

  function handleClickNewTask() {
    setShowCreateTaskWindow(true);
  }

  useEffect(() => {
    if (currentUser) {
      if (currentUser.dashboard_card_pk) {
        fetchDisplayCard(currentUser.dashboard_card_pk);
      }
    }
  }, [currentUser]);

  return (
    <div>
      <div className="p-6 bg-white rounded-lg shadow-sm">
        <ul className="space-y-3">
          <li>
            <span
              onClick={handleNewCard}
              className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 
        bg-blue-50 hover:bg-blue-100 cursor-pointer"
            >
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create a Card
            </span>
          </li>
          <li>
            <span
              onClick={handleClickNewTask}
              className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 
        bg-green-50 hover:bg-green-100 cursor-pointer"
            >
              <TasksIcon />
              Create a Task
            </span>
          </li>
          <li>
            <span
              className="flex items-center gap-3 p-3 rounded-lg transition-all duration-200 
        bg-purple-50 hover:bg-purple-100 cursor-pointer"
            >
              <svg
                className="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Upload a File
            </span>
          </li>
        </ul>
      </div>
      <div className="flex border-t">
        <div className="flex grow border-r w-8/12 p-2">
          <div>
            <div>
              <hr />
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  Welcome to Zettelgarden 🌱
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl">
                  Your personal space for growing ideas. Create cards, connect
                  thoughts, and watch your knowledge garden flourish. Get
                  started with the quick actions below.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex w-4/12 border-l m-2 truncate">
          <div>
            <span className="font-bold">Unsorted Cards</span>
            {partialCards && (
              <CardList
                cards={partialCards
                  .filter((card) => card.card_id === "")
                  .slice(0, 10)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
