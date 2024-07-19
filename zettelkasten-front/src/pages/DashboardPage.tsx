import React from "react";
import { fetchPartialCards } from "../api/cards";
import { CardItem } from "../components/cards/CardItem";
import { useEffect } from "react";
import { PartialCard } from "../models/Card";
import { TaskListItem } from "../components/tasks/TaskListItem";
import { isTodayOrPast } from "../utils/dates";
import { useTaskContext } from "../contexts/TaskContext";
import { usePartialCardContext } from "../contexts/CardContext";

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
      <h1>Dashboard Page</h1>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "50%" }}>
          <h3>Tasks</h3>
          {tasks &&
            tasks
              .filter((task) => !task.is_complete)
              .filter((task) => isTodayOrPast(task.scheduled_date))
              .slice(0, 10)
              .map((task) => (
                <TaskListItem
                  task={task}
                  setRefresh={setRefreshTasks}
                />
              ))}
        </div>
        <div style={{ flex: 1, minWidth: "50%" }}>
          <h3>Unsorted Cards</h3>
          {partialCards &&
            partialCards
              .filter((card) => card.card_id === "")
              .slice(0, 10)
              .map((card) => (
                <div key={card.id} style={{ marginBottom: "10px" }}>
                  <CardItem card={card} />
                </div>
              ))}
        </div>
        <div style={{ flex: 1, minWidth: "50%" }}>
          <h3>Recent Cards</h3>
          {partialCards &&
            partialCards.slice(0, 10).map((card) => (
              <div key={card.id} style={{ marginBottom: "10px" }}>
                <CardItem card={card} />
              </div>
            ))}
        </div>
        <div style={{ flex: 1, minWidth: "50%" }}>
          <h3>Inactive Cards</h3>
          {inactiveCards &&
            inactiveCards.slice(0, 10).map((card) => (
              <div key={card.id} style={{ marginBottom: "10px" }}>
                <CardItem card={card} />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
