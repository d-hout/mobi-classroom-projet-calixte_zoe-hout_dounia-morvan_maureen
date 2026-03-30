const BASE_URL = "https://api.disneyapi.dev";
import { getValidatedImageUrl } from "../utils/imageUtils";

export const fetchDisneyCharacters = async (page = 1, limit = 50) => {
  try {
    const res = await fetch(
      `${BASE_URL}/character?page=${page}&pageSize=${limit}`,
    );
    if (!res.ok) return [];
    const json = await res.json();
    const items = json.data || [];
    const mappedItems = await Promise.all(
      items
        .filter((c) => c.imageUrl)
        .map(async (c) => ({
          id: c._id ?? c.id,
          name: c.name,
          image: await getValidatedImageUrl(c.imageUrl),
          description: c.shortFilms?.join(", ") || c.films?.join(", ") || "",
        }))
    );
    return mappedItems;
  } catch (err) {
    console.error("fetchDisneyCharacters failed:", err);
    return [];
  }
};

export const fetchCharacterById = async (id) => {
  try {
    const res = await fetch(`${BASE_URL}/character/${id}`);
    if (!res.ok) return null;
    const json = await res.json();
    const c = json.data;
    return c
      ? {
          id: c._id ?? c.id,
          name: c.name,
          image: await getValidatedImageUrl(c.imageUrl),
          description: c.description || "",
        }
      : null;
  } catch (err) {
    console.error("fetchCharacterById failed:", err);
    return null;
  }
};
