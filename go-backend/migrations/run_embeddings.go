package migrations

import (
	"go-backend/handlers"
	"log"
)

func RunEmbeddings(h *handlers.Handler) {
	users, _ := h.QueryUsers()
	for _, user := range users {
		cards, _ := h.ClassicSearch(user.ID, handlers.SearchRequestParams{SearchTerm: ""})
		for _, card := range cards {
			log.Printf("user %v - card %v - %v", user.ID, card.CardID, card.Title)
			err := h.ChunkCard(card)
			if err != nil {
				log.Printf("chunking error %v", err)
				break
			}
			err = h.ChunkEmbedCard(user.ID, card.ID)
			if err != nil {
				log.Printf("embedding error %v", err)
				break
			}

			entities, _ := h.QueryEntitiesForCard(user.ID, card.ID)
			for _, entity := range entities {
				log.Printf("%v - %v", entity.ID, entity.Name)
				err := h.CalculateEmbeddingForEntity(entity)
				if err != nil {
					log.Printf("chunking error %v", err)
					break
				}
			}
		}
	}
}
