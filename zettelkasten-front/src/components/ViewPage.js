import { CardBody } from "./CardBody";
import { CardItem} from "./CardItem";

export function ViewPage({
  viewingCard,
  cards,
  parentCard,
  handleViewCard,
  handleEditCard,
}) {
  return (
    <div>
      <h2 style={{ marginBottom: "10px" }}>
        <span style={{ fontWeight: "bold", color: "blue" }}>
          {viewingCard.card_id}
        </span>
        <span>: {viewingCard.title}</span>
      </h2>
      <hr />
      <div style={{ marginBottom: "10px" }}>
        {CardBody(viewingCard, cards, handleViewCard)}
      </div>
      <div>
        {viewingCard.is_reference && (
		<div>
            <span style={{ fontWeight: "bold" }}>Link:</span>
            <span>{viewingCard.link}</span>
		</div>
        )}
      </div>
      <hr />
      <p>Created At: {viewingCard.created_at}</p>
      <p>Updated At: {viewingCard.updated_at}</p>
      <hr />
      {parentCard && (
        <div>
          <h4>Parent:</h4>
          <ul>
	      <CardItem
	  handleViewCard={handleViewCard}
	  card={parentCard}
	      />
              </ul>
        </div>
      )}
      <h4>Backlinks:</h4>
      <ul>
        {viewingCard.backlinks.map((backlink, index) => (
		<CardItem
	    handleViewCard={handleViewCard}
	    card={backlink}
	    />
        ))}
      </ul>
      <button onClick={handleEditCard}>Edit</button>
      <h4>Children:</h4>
      <ul>
        {cards
          .filter(
            (card) =>
              card.card_id.startsWith(`${viewingCard.card_id}/`) ||
              card.card_id.startsWith(`${viewingCard.card_id}.`),
          )
          .sort((a, b) => a.card_id.localeCompare(b.card_id))
          .map((childCard, index) => (
		  <CardItem
	      handleViewCard={handleViewCard}
	      card={childCard}
	      />
          ))}
      </ul>
    </div>
  );
}
