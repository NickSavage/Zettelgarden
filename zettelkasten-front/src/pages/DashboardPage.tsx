import React from "react";
import { fetchPartialCards, getCard } from "../api/cards";
import { useEffect } from "react";
import { PartialCard, Card } from "../models/Card";
import { isTodayOrPast } from "../utils/dates";
import { useTaskContext } from "../contexts/TaskContext";
import { usePartialCardContext } from "../contexts/CardContext";
import { H4, H6 } from "../components/Header";
import { CardList } from "../components/cards/CardList";
import { TaskList } from "../components/tasks/TaskList";
import { useAuth } from "../contexts/AuthContext";
import { CardBody } from "../components/cards/CardBody";

export function DashboardPage() {
  const { partialCards } = usePartialCardContext();
  const [inactiveCards, setInactiveCards] = React.useState<PartialCard[]>([]);
  //  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [refresh, setRefresh] = React.useState<boolean>(false);
  const { tasks, setRefreshTasks } = useTaskContext();
  const { currentUser } = useAuth();

  const [displayCard, setDisplayCard] = React.useState<Card | null>(null);

  async function fetchDisplayCard(cardPK: number) {
    await getCard(cardPK.toString()).then((card) => {
      setDisplayCard(card);
    });
  }

  useEffect(() => {
    fetchPartialCards("", "", true)
      .then((response) => {
        setInactiveCards(response);
      })
      .catch((error) => {
        console.error("Error fetching partial cards:", error);
      });
    setRefresh(false);
  }, [refresh]);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.dashboard_card_pk) {
        fetchDisplayCard(currentUser.dashboard_card_pk);
      }
    }
  }, [currentUser]);

  return (
    <div>
      <div className="px-10 py-10">
        <ul>
          <li>Create a Card</li>
          <li>Create a Task</li>
          <li>Upload a File</li>
        </ul>
      </div>
      <div className="flex border-t">
      <div className="flex grow border-r w-8/12 p-2">
          <div>
            <div>
              <hr />

              {displayCard && <CardBody viewingCard={displayCard} />}
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
