import React from "react";
import Button from "@mui/material/Button";

export default function Cartes({ card, onAdd, onRemove, inDeck, disabled }) {
  return (
    <div className="card-tile">
      <div className="card-media">
        <img src={card.image} alt={card.name} />
      </div>
      <div className="card-body">
        <div className="card-name">{card.name}</div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 8,
          }}
        >
          {inDeck ? (
            <Button
              size="small"
              color="error"
              onClick={() => onRemove(String(card.id))}
            >
              Retirer
            </Button>
          ) : (
            <Button
              size="small"
              onClick={() => onAdd(String(card.id))}
              disabled={disabled}
            >
              Ajouter
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
