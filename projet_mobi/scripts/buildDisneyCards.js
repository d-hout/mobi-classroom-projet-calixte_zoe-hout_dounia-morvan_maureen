import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const API_BASE = "https://api.disneyapi.dev/character";
const PAGE_SIZE = 50;
const MAX_PAGES = 3;

// A mettre si trop de cartes
/*const limitedCards = validCards.slice(0, 200);
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(limitedCards, null, 2), "utf-8");*/

// ✅ AJOUT : équivalent de __dirname en ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ chemin de sortie
const OUTPUT_FILE = path.join(__dirname, "..", "src", "data", "disneyCards.json");

async function fetchCharacters(page, pageSize = PAGE_SIZE) {
  console.log(`Fetch page ${page}...`);

  const res = await fetch(`${API_BASE}?page=${page}&pageSize=${pageSize}`);

  if (!res.ok) {
    throw new Error(`Erreur API Disney page ${page}: ${res.status}`);
  }

  const json = await res.json();
  return json.data || [];
}

async function isImageValid(url) {
  if (!url || typeof url !== "string") return false;

  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    const contentType = res.headers.get("content-type") || "";
    return res.ok && contentType.startsWith("image/");
  } catch {
    return false;
  }
}

function normalizeCard(raw) {
  return {
    id: String(raw._id ?? raw.id),
    name: raw.name || "Sans nom",
    image: raw.imageUrl || raw.image || null,
    films: raw.films || [],
    shortFilms: raw.shortFilms || [],
    tvShows: raw.tvShows || [],
    videoGames: raw.videoGames || [],
    parkAttractions: raw.parkAttractions || [],
    allies: raw.allies || [],
    enemies: raw.enemies || [],
  };
}

async function main() {
  console.log("Début du script");
  console.log("Fichier de sortie :", OUTPUT_FILE);

  const allRawCards = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const cards = await fetchCharacters(page);
    console.log(`Page ${page}: ${cards.length} cartes`);

    if (!cards.length) break;
    allRawCards.push(...cards);

    if (cards.length < PAGE_SIZE) break;
  }

  const normalized = allRawCards
    .map(normalizeCard)
    .filter((card) => card.id && card.name && card.image);

  console.log("Cartes normalisées :", normalized.length);

  const validCards = [];

  for (let i = 0; i < normalized.length; i++) {
    const card = normalized[i];
    const ok = await isImageValid(card.image);

    console.log(
      `[${i + 1}/${normalized.length}] ${card.name} -> ${ok ? "OK" : "KO"}`
    );

    if (ok) {
      validCards.push(card);
    }
  }

  console.log("Cartes valides :", validCards.length);

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(validCards, null, 2), "utf-8");

  console.log("Fichier généré avec succès :", OUTPUT_FILE);
}

main().catch((error) => {
  console.error("Erreur générale :", error);
  process.exit(1);
});