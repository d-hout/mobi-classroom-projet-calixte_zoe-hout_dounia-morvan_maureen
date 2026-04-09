import Button from "@mui/material/Button";
import { getDisplayImageUrl, handleImageError } from "../../utils/imageUtils";

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

  return (
    <article className="card-tile">
      <div className="card-media">
        <img
          src={getDisplayImageUrl(card.image)}
          alt={card.name}
          onError={handleImageError}
        />
      </div>
      <div className="card-body">
        <h2 className="card-name">{card.name}</h2>
        {showSource && (
          <p className="card-source">{sourceText || "Univers Disney"}</p>
        )}
        <div className="card-stats">
          ATK {card.atk ?? "-"} / DEF {card.def ?? "-"}
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
