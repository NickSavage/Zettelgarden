import { CardBody } from "./CardBody";
import { CardItem } from "./CardItem";

import { renderFile } from "../api";

export function ViewPage({
  viewingCard,
  cards,
  parentCard,
  handleViewCard,
  handleEditCard,
}) {
  const handleFileDownload = (fileId, e) => {
    e.preventDefault(); // Prevent the default anchor behavior
    renderFile(fileId).catch((error) => {
      // Handle any errors here, such as displaying a notification to the user
      console.error("Error downloading file:", error);
    });
  };

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
        {viewingCard.link && (
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
            <CardItem handleViewCard={handleViewCard} card={parentCard} />
          </ul>
        </div>
      )}
      <h4>Files:</h4>
      <ul>
        {viewingCard.files.map((file, index) => (
          <li key={file["id"]}>
            <span>{file.id} - </span>
            <a href="#" onClick={(e) => handleFileDownload(file.id, e)}>
              {file.name}
            </a>
          </li>
        ))}
      </ul>

      <h4>Backlinks:</h4>
      <ul>
        {viewingCard.backlinks.map((backlink, index) => (
          <CardItem handleViewCard={handleViewCard} card={backlink} />
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
            <CardItem handleViewCard={handleViewCard} card={childCard} />
          ))}
      </ul>
    </div>
  );
}
