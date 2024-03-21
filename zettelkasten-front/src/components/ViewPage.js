
import React, { useState, useEffect } from "react";
import { CardBody } from "./CardBody";
import { CardItem } from "./CardItem";
import { FileListItem } from "./FileListItem";
import { getCard} from "../api";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export function ViewPage({
  cards,
    setLastCardId,
}) {

  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [viewingCard, setViewCard] = useState(null);
  const [parentCard, setParentCard] = useState(null);
  const { id } = useParams();

    function handleEditCard() {
	navigate(`/app/card/${viewingCard.id}/edit`)
    }
  function onFileDelete(file_id) {}

    async function fetchCard(id) {
	let refreshed = await getCard(id);
	
    if ("error" in refreshed) {
      setError(refreshed["error"]);
    } else {
      setViewCard(refreshed);
      setLastCardId(refreshed.card_id);
      if ("id" in refreshed.parent) {
        let parentCardId = refreshed.parent.id;
        const parentCard = await getCard(parentCardId);
        setParentCard(parentCard);
      } else {
        setParentCard(null);
      }
    }
    }

    useEffect(() => {
	fetchCard(id);
    }, [id]);
  return (
      <div>
	  {viewingCard &&
    <div>
	<h3 style={{ marginBottom: "10px" }}>
		 
		 <span style={{ fontWeight: "bold", color: "blue" }}>
		     {viewingCard.card_id}
		 </span>
		 <span>: {viewingCard.title}</span>
	     </h3>
	     <hr />
	<div><CardBody viewingCard={viewingCard} cards={cards} /></div>
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
            <CardItem card={parentCard} />
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
          <CardItem card={backlink} />
        ))}
      </ul>
      <button onClick={handleEditCard}>Edit</button>
      <h4>Children:</h4>
      <ul>
        {viewingCard["children"]
          .sort((a, b) => a.card_id.localeCompare(b.card_id))
          .map((childCard, index) => (
            <CardItem card={childCard} />
          ))}
      </ul>
    </div>
	  }
	  </div>
  );
}
