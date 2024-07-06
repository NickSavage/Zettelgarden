import React from "react";
import { fetchPartialCards } from "../api/cards";
import { CardItem } from "../components/CardItem";
import { useEffect } from "react";
import { PartialCard } from "../models/Card";
import { Task } from "src/models/Task";
import { fetchTasks } from "src/api/tasks";
import { TaskListItem } from "src/components/tasks/TaskListItem";

export function DashboardPage() {
  const [partialCards, setPartialCards] = React.useState<PartialCard[]>([]);
  const [inactiveCards, setInactiveCards] = React.useState<PartialCard[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);

  useEffect(() => {
    fetchTasks()
    .then((response) => {
      setTasks(response);
    })
    .catch((error) => {
      console.error("somehting is bad", error)});

    fetchPartialCards("", "date")
      .then((response) => {
        setPartialCards(response);
      })
      .catch((error) => {
        console.error("Error fetching partial cards:", error);
      });
    fetchPartialCards("", "", true)
      .then((response) => {
        setInactiveCards(response);
      })
      .catch((error) => {
        console.error("Error fetching partial cards:", error);
      });
  }, []);

  return (
    <div>
      <h1>Dashboard Page</h1>
      <div style={{ display: "flex" }}>
        <div style={{ flex: 1 }}>
          <h3>Tasks</h3>
          {tasks && tasks
            .filter((task => !task.is_complete))
            .slice(0, 10)
            .map((task) => (
              <TaskListItem task={task} setRefresh={(refresh: boolean) => {}} />
            ))}
        </div>
        <div style={{ flex: 1 }}>
          <h3>Unsorted Cards</h3>
          {partialCards
            .filter((card) => card.card_id === "")
            .slice(0, 10)
            .map((card) => (
              <div key={card.id} style={{ marginBottom: "10px" }}>
                <CardItem card={card} />
              </div>
            ))}
        </div>
        <div style={{ flex: 1 }}>
          <h3>Recent Cards</h3>
          {partialCards.slice(0, 10).map((card) => (
            <div key={card.id} style={{ marginBottom: "10px" }}>
              <CardItem card={card} />
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <h3>Inactive Cards</h3>
          {inactiveCards.slice(0, 10).map((card) => (
            <div key={card.id} style={{ marginBottom: "10px" }}>
              <CardItem card={card} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
