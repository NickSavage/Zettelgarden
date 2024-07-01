import React from "react";
import { fetchPartialCards } from "../api/cards";
import { CardItem } from "../components/CardItem";
import { useEffect } from "react";
import { PartialCard } from "../models/Card";

export function DashboardPage() {
  const [partialCards, setPartialCards] = React.useState<PartialCard[]>([]);
  const [inactiveCards, setInactiveCards] = React.useState<PartialCard[]>([]);

  useEffect(() => {
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
