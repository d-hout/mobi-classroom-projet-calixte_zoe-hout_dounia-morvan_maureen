import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import DeckLobby from "../src/components/deck/DeckLobby";
import DeckSummary from "../src/components/deck/DeckSummary";

describe("DeckLobby", () => {
  it("ne rend rien sans gameId", () => {
    const { container } = render(<DeckLobby game={null} currentUid="u1" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("affiche les deux joueurs et leur état", () => {
    render(
      <DeckLobby
        game={{
          playerAUser: { uid: "u1", name: "Zoe", deckReady: true },
          playerBUser: { uid: "u2", name: "Dounia", deckReady: false },
        }}
        gameId="game-1"
        currentUid="u1"
      />,
    );

    expect(screen.getByText(/game-1/)).toBeInTheDocument();
    expect(screen.getByText(/Zoe/)).toHaveTextContent("(Moi)");
    expect(screen.getByText("Dounia")).toBeInTheDocument();
    expect(screen.getByText("Pret : Oui")).toBeInTheDocument();
    expect(screen.getByText("Pret : Non")).toBeInTheDocument();
  });
});

describe("DeckSummary", () => {
  const cards = [
    {
      id: "mickey",
      name: "Mickey Mouse",
      image: "https://example.com/mickey.png",
    },
    {
      id: "minnie",
      name: "Minnie Mouse",
      image: "https://example.com/minnie.png",
    },
  ];

  it("affiche les cartes sélectionnées et désactive la sauvegarde si le deck est incomplet", () => {
    render(
      <DeckSummary
        cards={cards}
        selected={["mickey", "minnie"]}
        saving={false}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByText("Cartes sélectionnées: 2 / 10")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Mickey Mouse" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Minnie Mouse" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sauvegarder le deck" }),
    ).toBeDisabled();
  });

  it("permet de sauvegarder quand 10 cartes sont sélectionnées", () => {
    const onSave = vi.fn();

    render(
      <DeckSummary
        cards={cards}
        selected={Array.from({ length: 10 }, (_, index) =>
          index % 2 === 0 ? "mickey" : "minnie",
        )}
        saving={false}
        onSave={onSave}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Sauvegarder le deck" }));

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("affiche l'état de sauvegarde", () => {
    render(
      <DeckSummary
        cards={cards}
        selected={Array.from({ length: 10 }, () => "mickey")}
        saving
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Sauvegarde..." })).toBeDisabled();
  });
});
