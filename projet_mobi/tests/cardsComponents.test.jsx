import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import CardGrid from "../src/components/cards/CardGrid";
import CardSearchToolbar from "../src/components/cards/CardSearchToolbar";
import CardTile from "../src/components/cards/CardTile";

const card = {
  id: "mickey",
  name: "Mickey Mouse",
  image: "https://example.com/mickey.png",
  atk: 7,
  def: 4,
  films: ["Fantasia"],
  shortFilms: ["Steamboat Willie"],
  tvShows: [],
};

describe("CardTile", () => {
  it("affiche une carte en lecture seule avec ses stats et sa source", () => {
    render(<CardTile card={card} showSource />);

    expect(screen.getByRole("img", { name: "Mickey Mouse" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Mickey Mouse" })).toBeInTheDocument();
    expect(screen.getByText("Fantasia, Steamboat Willie")).toBeInTheDocument();
    expect(screen.getByText("ATK 7 / DEF 4")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("appelle onAdd quand la carte n'est pas sélectionnée", () => {
    const onAdd = vi.fn();

    render(<CardTile card={card} onAdd={onAdd} />);
    fireEvent.click(screen.getByRole("button", { name: "Ajouter" }));

    expect(onAdd).toHaveBeenCalledWith("mickey");
  });

  it("appelle onRemove quand la carte est sélectionnée", () => {
    const onRemove = vi.fn();

    render(<CardTile card={card} selected onRemove={onRemove} />);
    fireEvent.click(screen.getByRole("button", { name: "Retirer" }));

    expect(onRemove).toHaveBeenCalledWith("mickey");
  });
});

describe("CardGrid", () => {
  it("affiche un message pendant le chargement", () => {
    render(<CardGrid cards={[]} loading />);

    expect(screen.getByText("Chargement...")).toBeInTheDocument();
  });

  it("affiche un message quand aucune carte n'est disponible", () => {
    render(<CardGrid cards={[]} loading={false} emptyText="Rien ici." />);

    expect(screen.getByText("Rien ici.")).toBeInTheDocument();
  });

  it("utilise renderCard quand il est fourni", () => {
    render(
      <CardGrid
        cards={[card]}
        loading={false}
        renderCard={(item) => <span key={item.id}>Carte custom {item.name}</span>}
      />,
    );

    expect(screen.getByText("Carte custom Mickey Mouse")).toBeInTheDocument();
  });
});

describe("CardSearchToolbar", () => {
  it("met à jour la recherche et lance la recherche avec Enter", () => {
    const onQueryChange = vi.fn();
    const onSearch = vi.fn();

    render(
      <CardSearchToolbar
        query=""
        onQueryChange={onQueryChange}
        onSearch={onSearch}
        onReset={vi.fn()}
        loading={false}
        countLabel="1 carte"
      />,
    );

    const input = screen.getByPlaceholderText("Rechercher une carte");
    fireEvent.change(input, { target: { value: "mickey" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onQueryChange).toHaveBeenCalledWith("mickey");
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(screen.getByText("1 carte")).toBeInTheDocument();
  });

  it("appelle onReset avec le bouton Réinitialiser", () => {
    const onReset = vi.fn();

    render(
      <CardSearchToolbar
        query="mickey"
        onQueryChange={vi.fn()}
        onSearch={vi.fn()}
        onReset={onReset}
        loading={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Réinitialiser" }));

    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
