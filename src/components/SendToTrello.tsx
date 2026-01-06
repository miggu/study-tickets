import { type PlanDay } from "../utils";
import { useState } from "react";
import { trello } from "../svgs/trello"; // Import the trello function

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
    <div className="send-to-trello">
      <button
        type="button"
        onClick={handleSendToTrello}
        disabled={loading}
        className="button-primary send-to-trello-button"
      >
        {loading ? (
          "Sending..."
        ) : (
          <>
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {trello()}
            </svg>
            Send to Trello
          </>
        )}
      </button>
      <div className="send-to-trello__status" aria-live="polite">
        {error && (
          <p className="plan__message plan__message--error" role="alert">
            {error}
          </p>
        )}
        {boardUrl && (
          <p className="plan__message">
            Trello board created.{" "}
            <a href={boardUrl} target="_blank" rel="noopener noreferrer">
              Open board
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
