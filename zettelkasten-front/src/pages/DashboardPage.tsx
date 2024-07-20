import React from "react";
import { fetchPartialCards } from "../api/cards";
import { CardItem } from "../components/cards/CardItem";
import { useEffect } from "react";
import { PartialCard } from "../models/Card";
import { TaskListItem } from "../components/tasks/TaskListItem";
import { isTodayOrPast } from "../utils/dates";
import { useTaskContext } from "../contexts/TaskContext";
import { usePartialCardContext } from "../contexts/CardContext";
import { HeaderSection, HeaderTop } from "../components/Header";

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
          {tasks &&
            tasks
              .filter((task) => !task.is_complete)
              .filter((task) => isTodayOrPast(task.scheduled_date))
              .slice(0, 10)
              .map((task) => (
                <TaskListItem task={task} setRefresh={setRefreshTasks} />
              ))}
        </div>
        <div style={{ flex: 1, minWidth: "50%" }}>
          <HeaderSection text="Unsorted Cards" />
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
          <HeaderSection text="Recent Cards" />
          {partialCards &&
            partialCards.slice(0, 10).map((card) => (
              <div key={card.id} style={{ marginBottom: "10px" }}>
                <CardItem card={card} />
              </div>
            ))}
        </div>
        <div style={{ flex: 1, minWidth: "50%" }}>
          <HeaderSection text="Inactive Cards" />
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
