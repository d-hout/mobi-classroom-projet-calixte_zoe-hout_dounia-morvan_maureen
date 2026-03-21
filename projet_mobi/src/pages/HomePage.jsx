import Typography from "@mui/material/Typography";
import Header from "../components/Header";

export default function HomePage() {
  return (
    <>
      <Header />
      <Typography
        variant="h4"
        component="h1"
        marginLeft="10px"
        marginBottom="20px"
      >
        Création du deck
      </Typography>

      <div className="hero-grid">
        <div className="hero-left">
          <h1>Cartes disponibles</h1>
        </div>
        <div className="hero-right">
          <h1>Résumé </h1>
        </div>
      </div>
    </>
  );
}
