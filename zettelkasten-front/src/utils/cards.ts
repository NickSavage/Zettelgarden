import { PartialCard } from "../models/Card";

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