import React, { useEffect, useState } from "react";
import { Card } from "../../models/Card";
import { getNextFlashcard, postNextFlashcard } from "../../api/cards";

interface FlashcardNextPageProps {}

export function FlashcardNextPage({}: FlashcardNextPageProps) {
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [showAnswer, setShowAnswer] = useState<boolean>(false);

  async function fetchRecordNextFlashcard(rating: string) {
    if (!activeCard) {
      return;
    }
    let response = await postNextFlashcard(activeCard.id, rating);
    setActiveCard(response);
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
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded">
      <span className="block text-2xl font-semibold mb-4">
        {activeCard.title}
      </span>
      {!showAnswer ? (
        <div className="flex justify-center">
          <button
            className="bg-cyan-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition duration-200"
            onClick={() => setShowAnswer(true)}
          >
            Show Answer
          </button>
        </div>
      ) : (
        <div>
          <span className="block text-lg mb-4">{activeCard.body}</span>
          <div className="flex justify-around">
            <button
              className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition duration-200"
              onClick={() => handleButtonClick("Again")}
            >
              Again
            </button>
            <button
              className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 transition duration-200"
              onClick={() => handleButtonClick("Hard")}
            >
              Hard
            </button>
            <button
              className="bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600 transition duration-200"
              onClick={() => handleButtonClick("Good")}
            >
              Good
            </button>
            <button
              className="bg-cyan-500 text-white px-3 py-2 rounded hover:bg-blue-600 transition duration-200"
              onClick={() => handleButtonClick("Easy")}
            >
              Easy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
