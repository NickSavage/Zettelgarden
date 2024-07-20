import React from "react";
import { fetchPartialCards } from "../api/cards";
import { useEffect } from "react";
import { PartialCard } from "../models/Card";
import { isTodayOrPast } from "../utils/dates";
import { useTaskContext } from "../contexts/TaskContext";
import { usePartialCardContext } from "../contexts/CardContext";
import { HeaderSection, HeaderTop } from "../components/Header";
import { CardList } from "../components/cards/CardList";
import { TaskList } from "../components/tasks/TaskList";

export function DashboardPage() {
  const { partialCards } = usePartialCardContext();
  const [inactiveCards, setInactiveCards] = React.useState<PartialCard[]>([]);
  //  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [refresh, setRefresh] = React.useState<boolean>(false);
  const { tasks, setRefreshTasks } = useTaskContext();

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

  return (
    <div>
      <HeaderTop text="Dashboard" />
      <div className="mt-5" style={{ display: "flex", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "50%" }}>
          <HeaderSection text="Tasks" />
          {tasks && (
            <TaskList
              tasks={tasks
                .filter((task) => !task.is_complete)
                .filter((task) => isTodayOrPast(task.scheduled_date))
                .slice(0, 10)}
            />
          )}
        </div>
        <div style={{ flex: 1, minWidth: "50%" }}>
          <HeaderSection text="Unsorted Cards" />
          {partialCards && (
            <CardList
              cards={partialCards
                .filter((card) => card.card_id === "")
                .slice(0, 10)}
            />
          )}
        </div>
        <div style={{ flex: 1, minWidth: "50%" }}>
          <HeaderSection text="Recent Cards" />
          {partialCards && <CardList cards={partialCards.slice(0, 10)} />}
        </div>
        <div style={{ flex: 1, minWidth: "50%" }}>
          <HeaderSection text="Inactive Cards" />
          {inactiveCards && <CardList cards={inactiveCards.slice(0, 10)} />}
        </div>
      </div>
    </div>
  );
}
