
export function getIdByCardId(cards, targetCardId) {
    const foundCard = cards.find(card => card.card_id === targetCardId);
    return foundCard ? foundCard.id : null;
    
}

// Function to check if card_id is unique
export function isCardIdUnique(cards, id) {
    return !cards.some(card => card.card_id === id);
    
};

    
