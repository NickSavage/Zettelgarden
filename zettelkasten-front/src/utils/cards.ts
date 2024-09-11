import { PartialCard, Card } from "../models/Card";

// filter the card_id and title by searchText, return top 5 matches
export function quickFilterCards(
  cards: PartialCard[],
  searchText: string,
): PartialCard[] {
  let searchTextLower = searchText.toLowerCase().trim();
  const exactMatch = cards.find(
    (card) => card.card_id.toLowerCase() === searchText.toLowerCase(),
  );
  const searchResults = cards.filter((card) => {
    return (
      card.card_id.toLowerCase().startsWith(searchTextLower) ||
      card.title.toLowerCase().includes(searchTextLower)
    );
  });

  let filteredCards = exactMatch
    ? [exactMatch, ...searchResults]
    : searchResults;

  filteredCards = filteredCards.filter(
    (card, index, self) =>
      index === self.findIndex((t) => t.card_id === card.card_id),
  );
  let results = filteredCards.slice(0, 5);
  return results;
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
    is_literature_card: card.is_literature_card,
    tags: card.tags,
  };
}

export function isCardIdUnique(cards: Card[]|PartialCard[], id: string): boolean {
  return !cards.some((card) => card.card_id === id);
}

export function sortCards(cards, value) {
  let temp = [...cards];
  if (value === "sortBigSmall" || value === "sortSmallBig") {
    temp.sort((a, b) => {
      const partsA = a.card_id.match(/\D+|\d+/g) || [];
      const partsB = b.card_id.match(/\D+|\d+/g) || [];
      for (let i = 0; i < Math.min(partsA.length, partsB.length); i++) {
        if (isNaN(partsA[i]) || isNaN(partsB[i])) {
          // Compare non-numeric parts lexicographically
          const comparison = partsA[i].localeCompare(partsB[i]);
          if (comparison !== 0)
            return value === "sortBigSmall" ? comparison : -comparison;
        } else {
          // Compare numeric parts numerically
          const comparison = parseInt(partsA[i]) - parseInt(partsB[i]);
          if (comparison !== 0)
            return value === "sortBigSmall" ? comparison : -comparison;
        }
      }
      return (
        (value === "sortBigSmall" ? 1 : -1) * (partsA.length - partsB.length)
      );
    });
  } else if (value === "sortNewOld") {
    temp.sort((a, b) => {
      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });
  } else if (value === "sortOldNew") {
    temp.sort((a, b) => {
      return (
        new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
      );
    });
  } else {
  }
  return temp;
}
