import React from "react";
import { fetchPartialCards, getCard } from "../api/cards";
import { sortCards } from "../utils/cards";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTaskContext } from "../contexts/TaskContext";
import { usePartialCardContext } from "../contexts/CardContext";
import { SearchResultList } from "../components/cards/SearchResultList";
import { useNavigate } from "react-router-dom";
import { TasksIcon } from "../assets/icons/TasksIcon";

import { defaultCard } from "../models/Card";
import { FileUpload } from "../components/files/FileUpload";

import { useShortcutContext } from "../contexts/ShortcutContext";
import { CardList } from "../components/cards/CardList";

export function DashboardPage() {
  const { partialCards } = usePartialCardContext();
  const [refresh, setRefresh] = React.useState<boolean>(false);
  const { tasks, setRefreshTasks } = useTaskContext();
  const [message, setMessage] = React.useState<string>("");

  const navigate = useNavigate();

  const recentCards = partialCards.slice(0, 10).sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div>
      {/* Main Content Section */}
      <div className="p-2">
        <div className="text-center">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3 p-10">
              Welcome to Zettelgarden 🌱
            </h1>
            <p className="text-lg text-gray-600 max-w-full">
              Your personal space for growing ideas. Create cards, connect
              thoughts, and watch your knowledge garden flourish.
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-col md:flex-row border-t">
        {/* Left Section */}

        <div className="flex-grow md:w-8/12 border-r p-4">
          <a href="/app/search?recent=true">
            <span className="font-bold">Recent Cards</span>
          </a>
          {partialCards && <CardList sort={false} cards={recentCards} />}
          <hr />
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
          <hr />
        </div>
      </div>
    </div>
  );
}
