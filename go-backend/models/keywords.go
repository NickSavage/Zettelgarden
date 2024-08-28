package models

type Keyword struct {
	ID      int    `json:"id"`
	CardPK  int    `json:"card_pk"`
	UserID  int    `json:"userid"`
	Keyword string `json:"keyword"`
}
