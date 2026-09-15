import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { getDisplayImageUrl, handleImageError } from "../../utils/imageUtils";

export default function DeckSummary({
  cards,
  selected,
  saving,
  onSave,
  validationMessage = "",
}) {
  return (
    <Paper
      elevation={2}
      className="deck-summary-panel deck-summary-panel--top"
      sx={{ p: 2 }}
    >
      <Typography
        variant="subtitle2"
        component="div"
        className="deck-summary-title"
      >
        Résumé
      </Typography>

      <p className="deck-summary-count">
        Cartes sélectionnées: {selected.length} / 10
      </p>
      {validationMessage && (
        <p className="deck-summary-hint" role="status">
          {validationMessage}
        </p>
      )}

      <div className="summary-thumbs">
        {selected.map((id) => {
          const card = cards.find((item) => String(item.id) === String(id));

          return card ? (
            <div key={id} className="summary-thumb">
              <img
                src={getDisplayImageUrl(card.image)}
                alt={card.name}
                onError={handleImageError}
                className="summary-thumb-image"
              />
            </div>
          ) : (
            <div key={id} className="summary-thumb summary-thumb--empty" />
          );
        })}
      </div>

      <div className="deck-summary-actions">
        <Button
          variant="contained"
          color="primary"
          onClick={onSave}
          disabled={selected.length !== 10 || saving}
          className="bouton-blue"
        >
          {saving ? "Sauvegarde..." : "Sauvegarder le deck"}
        </Button>
      </div>
    </Paper>
  );
}
