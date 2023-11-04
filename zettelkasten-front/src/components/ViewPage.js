import { CardBody } from "./CardBody";

export function ViewPage({
  viewingCard,
  cards,
  handleViewBacklink,
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
        {CardBody(viewingCard, cards, handleViewBacklink)}
      </div>
      <div>
        {viewingCard.is_reference && (
          <>
            <span style={{ fontWeight: "bold" }}>Link:</span>
            <span>{viewingCard.link}</span>
          </>
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
            <li style={{ marginBottom: "10px" }}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleViewCard(parentCard);
                }}
                style={{ color: "black", textDecoration: "none" }}
              >
                <span style={{ color: "blue", fontWeight: "bold" }}>
                  {parentCard.card_id}
                </span>
                : {parentCard.title}
              </a>
            </li>
          </ul>
        </div>
      )}
      <h4>Backlinks:</h4>
      <ul>
        {viewingCard.backlinks.map((backlink, index) => (
          <li key={index} style={{ marginBottom: "10px" }}>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleViewBacklink(backlink);
              }}
              style={{ color: "black", textDecoration: "none" }}
            >
              <span style={{ color: "blue", fontWeight: "bold" }}>
                {backlink.card_id}
              </span>
              : {backlink.title}
            </a>
          </li>
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
            <li key={index} style={{ marginBottom: "10px" }}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleViewCard(childCard);
                }}
                style={{ color: "black", textDecoration: "none" }}
              >
                <span style={{ color: "blue", fontWeight: "bold" }}>
                  {childCard.card_id}
                </span>
                : {childCard.title}
              </a>
            </li>
          ))}
      </ul>
    </div>
  );
}
