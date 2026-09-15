import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";

export default function CardSearchToolbar({
  query,
  onQueryChange,
  onSearch,
  onReset,
  loading,
  placeholder = "Rechercher une carte",
  countLabel,
  className = "card-search-toolbar",
  searchClassName = "card-search-input",
  extraAction = null,
}) {
  return (
    <section className={className}>
      <TextField
        size="small"
        placeholder={placeholder}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") onSearch();
        }}
        className={searchClassName}
      />
      <Button
        size="small"
        variant="outlined"
        onClick={onSearch}
        disabled={loading}
        className="deck-toolbar-btn"
      >
        Rechercher
      </Button>
      <Button
        size="small"
        onClick={onReset}
        disabled={loading}
        className="deck-toolbar-btn deck-toolbar-btn--plain"
      >
        Réinitialiser
      </Button>
      {extraAction}
      {countLabel && <div className="card-search-count">{countLabel}</div>}
    </section>
  );
}
