export function getIdByCardId(cards, targetCardId) {
  const foundCard = cards.find((card) => card.card_id === targetCardId);
  return foundCard ? foundCard.id : null;
}

// Function to check if card_id is unique
export function isCardIdUnique(cards, id) {
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
      return new Date(b.updated_at) - new Date(a.updated_at);
    });
  } else if (value === "sortOldNew") {
    temp.sort((a, b) => {
      return new Date(a.updated_at) - new Date(b.updated_at);
    });
  } else {
  }
  return temp;
}

export function getToday() {
  return new Date();
}

export function getTomorrow() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return tomorrow;
}

export function getYesterday() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  return yesterday;
}


export function compareDates(date1, date2) {
  if (date1 === null || date2 === null) {
    return false
  }
  console.log(date1, date2)
  return date1.getDate() === date2.getDate() && 
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear()
}