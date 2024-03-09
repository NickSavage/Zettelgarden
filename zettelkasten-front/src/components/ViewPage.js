import { CardBody } from "./CardBody";
import { CardItem } from "./CardItem";
import { FileListItem } from "./FileListItem";

export function ViewPage({
  viewingCard,
  cards,
  parentCard,
  handleViewCard,
  handleEditCard,
}) {
  function onFileDelete(file_id) {}

  return (
    <div>
      <h3 style={{ marginBottom: "10px" }}>
        <span style={{ fontWeight: "bold", color: "blue" }}>
          {viewingCard.card_id}
        </span>
        <span>: {viewingCard.title}</span>
      </h3>
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
          <FileListItem
            file={file}
            onDelete={onFileDelete}
            handleViewCard={null}
            openRenameModal={null}
            displayCard={false}
          />
        ))}
      </ul>

      <h4>References:</h4>
      <ul>
        {viewingCard.references.map((backlink, index) => (
          <CardItem handleViewCard={handleViewCard} card={backlink} />
        ))}
      </ul>
      <button onClick={handleEditCard}>Edit</button>
      <h4>Children:</h4>
      <ul>
        {viewingCard["children"]
          .sort((a, b) => a.card_id.localeCompare(b.card_id))
          .map((childCard, index) => (
            <CardItem handleViewCard={handleViewCard} card={childCard} />
          ))}
      </ul>
    </div>
  );
}
