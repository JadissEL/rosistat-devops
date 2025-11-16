import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Editor } from "./Editor";

describe("Editor component", () => {
  it("renders and allows sending a prompt", async () => {
    render(<Editor />);

    const textarea = screen.getByLabelText("editor-input") as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: "test prompt" } });
    expect(textarea.value).toBe("test prompt");

    const button = screen.getByText(/Envoyer|Envoi…/i);
    fireEvent.click(button);

    // The component uses a fallback mock; after clicking we expect the response area to appear
    const response = await screen.findByText(/Réponse :/i);
    expect(response).toBeInTheDocument();
  });
});
// Fichier supprimé : test Editor désactivé
