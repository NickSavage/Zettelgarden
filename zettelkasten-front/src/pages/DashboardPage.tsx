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

import { defaultCard } from "../models/Card";
import { FileUpload } from "../components/files/FileUpload";

import { useShortcutContext } from "../contexts/ShortcutContext";

export function DashboardPage() {
  const { partialCards } = usePartialCardContext();
  const [refresh, setRefresh] = React.useState<boolean>(false);
  const { tasks, setRefreshTasks } = useTaskContext();
  const [message, setMessage] = React.useState<string>("");
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
      {/* Main Content Section */}
      <div className="p-2">
        <div>
          <hr />
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Welcome to Zettelgarden 🌱
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              Your personal space for growing ideas. Create cards, connect
              thoughts, and watch your knowledge garden flourish.
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row border-t">
        {/* Left Section */}

        <div className="flex-grow md:w-8/12 border-r p-4">
          <span className="font-bold">Recent Cards</span>
        </div>

        {/* Right Section */}
        <div className="flex-shrink-0 md:w-4/12 border-l p-4">
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
