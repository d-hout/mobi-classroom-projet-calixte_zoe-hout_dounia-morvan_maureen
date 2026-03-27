//fichier juste pour tester la connexion à l'api, sera supprimé ensuite 

import { useEffect, useState } from "react";
import { fetchDisneyCharacters } from "../services/disneyService";

export default function DisneyTest({ page = 1 }) {
  const [chars, setChars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchDisneyCharacters(page)
      .then((list) => {
        if (!mounted) return;
        setChars(list.slice(0, 12));
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || String(err));
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [page]);

  if (loading) return <div>Chargement des personnages...</div>;
  if (error) return <div>Erreur: {error}</div>;
  if (!chars.length) return <div>Aucun personnage trouvé.</div>;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      {chars.map((c) => (
        <div key={c.id} style={{ width: 140, textAlign: "center" }}>
          {c.image ? (
            <img
              src={c.image}
              alt={c.name}
              style={{
                width: 120,
                height: 120,
                objectFit: "cover",
                borderRadius: 8,
              }}
            />
          ) : (
            <div
              style={{
                width: 120,
                height: 120,
                background: "#eee",
                borderRadius: 8,
              }}
            />
          )}
          <div style={{ fontWeight: "600", marginTop: 6 }}>{c.name}</div>
          <div style={{ fontSize: 12, color: "#666" }}>{c.description}</div>
        </div>
      ))}
    </div>
  );
}
