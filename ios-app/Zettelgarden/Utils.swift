import Foundation
import ZettelgardenShared

func cardToPartialCard(card: Card) -> PartialCard {
    return PartialCard(
        id: card.id,
        card_id: card.card_id,
        user_id: card.user_id,
        title: card.title,
        parent_id: card.parent_id,
        created_at: card.created_at,
        updated_at: card.updated_at,
        tags: card.tags,
        is_flashcard: card.is_flashcard
    )
}
