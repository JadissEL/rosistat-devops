export type EditorResponse = { text: string } | Record<string, unknown> | null;

export async function sendEditorRequest(prompt: string): Promise<EditorResponse> {
  // Fichier supprimé : API client Editor désactivée
  try {
    const res = await fetch("/api/editor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) {
      // fallback to mock
      return { text: `Réponse simulée pour: ${prompt}` };
    }

    const data = await res.json();
    return data;
  } catch (err) {
    // Network or CORS error -> return mock
    return { text: `Réponse simulée pour: ${prompt}` };
  }
}

export default sendEditorRequest;
export default sendEditorRequest;
