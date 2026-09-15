import { useState } from "react";
import Button from "@mui/material/Button";
import {
  getDisplayImageUrl,
  handleImageError,
  isUsableImageUrl,
} from "../../utils/imageUtils";

function getCardSource(card) {
  const sources = [
    ...(card.films || []),
    ...(card.shortFilms || []),
    ...(card.tvShows || []),
  ];

  return sources.slice(0, 2).join(", ");
}

export default function CardTile({
  card,
  selected = false,
  disabled = false,
  onAdd,
  onRemove,
  showSource = false,
}) {
  const sourceText = getCardSource(card);
  const hasDeckAction = onAdd || onRemove;
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const imageUnavailable = !isUsableImageUrl(card.image) || imageLoadFailed;

  return (
    <article className="card-tile">
      <div className="card-media">
        <img
          src={getDisplayImageUrl(card.image)}
          alt={card.name}
          onError={(event) => {
            setImageLoadFailed(true);
            handleImageError(event);
          }}
        />
        {imageUnavailable && (
          <span className="card-media-badge">Image indisponible</span>
        )}
      </div>
      <div className="card-body">
        <h2 className="card-name">{card.name}</h2>
        {showSource && (
          <p className="card-source">{sourceText || "Univers Disney"}</p>
        )}
        <div className="card-stats">
          <span>Attaque {card.atk ?? "-"}</span>
          <span>Défense {card.def ?? "-"}</span>
        </div>

        {hasDeckAction && (
          <div className="card-actions">
            {selected ? (
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
        )}
      </div>
    </article>
  );
}
