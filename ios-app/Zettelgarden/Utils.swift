import Foundation
import ZettelgardenShared

func cardToPartialCard(card: Card) -> PartialCard {
    return PartialCard(
        id: card.id,
        card_id: card.card_id,
        user_id: card.user_id,
        title: card.title,
        created_at: card.created_at,
        updated_at: card.updated_at
    )
}
