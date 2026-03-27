import Header from "../components/Header";
import Button from "@mui/material/Button";
import "../App.css";
import bg from "../assets/disney2.jpg";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          zIndex: -1,
        }}
      ></div>
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Header />
        <div className="center">
          <Button
            className="bouton-blue"
            variant="contained"
            onClick={() => navigate("/DeckPage")}
          >
            Nouvelle partie
          </Button>
          <Button
            className="bouton-blue"
            variant="contained"
            onClick={() => navigate("/DeckPage")}
          >
            Rejoindre partie
          </Button>
        </div>
      </div>
    </>
  );
}
