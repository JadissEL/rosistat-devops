import React, { useState } from "react";
import { sendEditorRequest } from "@/lib/editorApi";

export function Editor(): JSX.Element {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleSend = async () => {
    setLoading(true);
    setResponse(null);
    try {
      const res = await sendEditorRequest(prompt);
      setResponse(res?.text ?? JSON.stringify(res));
    } catch (err) {
      setResponse("Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-2">Éditeur</h3>
      <textarea
        aria-label="editor-input"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full min-h-[80px] rounded-md p-2 bg-slate-900 text-white border border-slate-700 mb-3"
        placeholder="Tapez un texte ou une requête..."
      />
      <div className="flex items-center gap-2">
        <button
          onClick={handleSend}
          disabled={loading}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
        >
          {loading ? "Envoi…" : "Envoyer"}
        </button>
        <button
          onClick={() => {
            setPrompt("");
            setResponse(null);
          }}
          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm"
        >
          Réinitialiser
        </button>
      </div>

      {response && (
        <div className="mt-3 bg-slate-900 border border-slate-700 p-3 rounded text-sm">
          <strong>Réponse :</strong>
          <div className="whitespace-pre-wrap mt-2">{response}</div>
        </div>
      )}
    </div>
  );
}

export default Editor;
