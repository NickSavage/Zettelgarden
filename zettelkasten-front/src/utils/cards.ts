import { PartialCard, Card } from "../models/Card";

// filter the card_id and title by searchText, return top 5 matches
export function quickFilterCards(cards: PartialCard[], searchText: string): PartialCard[] {
    let searchTextLower = searchText.toLowerCase().trim()
        const exactMatch = cards.find((card) => card.card_id.toLowerCase() === searchText.toLowerCase() )
      const searchResults = cards.filter((card) => {
        return (
          card.card_id.toLowerCase().startsWith(searchTextLower) ||
          card.title.toLowerCase().includes(searchTextLower)
        );
      });

      let filteredCards = exactMatch ? [exactMatch, ...searchResults] : searchResults;

      filteredCards = filteredCards.filter(
        (card, index, self) =>
          index === self.findIndex((t) => t.card_id === card.card_id)
      );
      let results = filteredCards.slice(0, 5);
      return results
}
export function convertCardToPartialCard(card: Card): PartialCard {
  return {
    id: card.id,
    card_id: card.card_id,
    user_id: card.user_id,
    title: card.title,
    parent_id: card.parent_id,
    created_at: card.created_at,
    updated_at: card.updated_at,
  };
}
