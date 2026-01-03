import { type PlanDay } from "../utils";
import { useState } from "react";

type Props = {
  plan: PlanDay[];
  courseTitle: string;
};

export function SendToTrello({ plan, courseTitle }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [boardUrl, setBoardUrl] = useState<string | null>(null);

  const handleSendToTrello = async () => {
    setLoading(true);
    setError(null);
    setBoardUrl(null);

    try {
      const response = await fetch("/api/trello/create-board", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseTitle,
          plan,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to send to Trello.");
      }

      const { boardUrl: newBoardUrl } = await response.json();
      setBoardUrl(newBoardUrl);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An unknown error occurred. Ensure Trello credentials are set on the server.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button type="button" onClick={handleSendToTrello} disabled={loading}>
        {loading ? "Sending..." : "Send to Trello"}
      </button>
      {error && <p className="plan__message--error">{error}</p>}
      {boardUrl && (
        <p className="plan__message">
          Successfully created Trello board:{" "}
          <a href={boardUrl} target="_blank" rel="noopener noreferrer">
            {boardUrl}
          </a>
        </p>
      )}
    </>
  );
}
