import React from "react";
import Button from "@mui/material/Button";
import { getDisplayImageUrl, handleImageError } from "../utils/imageUtils";

export default function Cartes({ card, onAdd, onRemove, inDeck, disabled }) {
  return (
    <div className="card-tile">
      <div className="card-media">
        <img
          src={getDisplayImageUrl(card.image)}
          alt={card.name}
          onError={handleImageError}
        />
      </div>
      <div className="card-body">
        <div className="card-name">{card.name}</div>
        <div className="card-actions">
          {inDeck ? (
            <Button
              size="small"
              color="error"
              onClick={() => onRemove(String(card.id))}
              className="card-action-btn"
            >
              Retirer
            </Button>
          ) : (
            <Button
              size="small"
              onClick={() => onAdd(String(card.id))}
              disabled={disabled}
              className="card-action-btn"
            >
              Ajouter
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
