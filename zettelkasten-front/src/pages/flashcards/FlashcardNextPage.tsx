import React, { useEffect, useState } from "react";
import { Card } from "../../models/Card";
import { getNextFlashcard, postNextFlashcard } from "../../api/cards";

interface FlashcardNextPageProps {}

export function FlashcardNextPage({}: FlashcardNextPageProps) {
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);

  async function fetchRecordNextFlashcard(rating: string) {
    if (!activeCard) {
      return
    }
    let response = await postNextFlashcard(activeCard.id, rating)
    setActiveCard(response)
    
  }
  async function fetchNextFlashcard() {
    let response = await getNextFlashcard();
    setActiveCard(response);
  }
  function handleButtonClick(rating: string) {
    console.log(`Button clicked: ${rating}`);
    // Additional logic can be added here based on the button clicked.
    setShowAnswer(false);
    fetchRecordNextFlashcard(rating);
  }
  useEffect(() => {
    fetchNextFlashcard();
  }, []);

  if (!activeCard) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <span>{activeCard.title}</span>
      {!showAnswer && (
        <div>
          <button onClick={() => setShowAnswer(true)}>Show Answer</button>
        </div>
      )}
      {showAnswer && (
        <div>
          <span>{activeCard.body}</span>
          <div>
            <button onClick={() => handleButtonClick("Again")}>Again</button>
            <button onClick={() => handleButtonClick("Hard")}>Hard</button>
            <button onClick={() => handleButtonClick("Good")}>Good</button>
            <button onClick={() => handleButtonClick("Easy")}>Easy</button>
          </div>
        </div>
      )}
    </div>
  );
}
