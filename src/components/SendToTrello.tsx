import { type PlanDay } from "../utils";
import { useTrello } from "../hooks/useTrello";
import { useState } from "react";
import { createBoard, createList, createCard } from "../utils/trello";

type Props = {
  plan: PlanDay[];
  courseTitle: string;
};

export function SendToTrello({ plan, courseTitle }: Props) {
  const { apiKey, setApiKey, token, setToken, getTrelloCredentials } =
    useTrello();
  const [showCredentials, setShowCredentials] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendToTrello = async () => {
    const credentials = getTrelloCredentials();
    if (!credentials) {
      setShowCredentials(true);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const board = await createBoard(
        courseTitle,
        credentials.apiKey,
        credentials.token,
      );

      for (const day of plan) {
        const list = await createList(
          board.id,
          `Day ${day.day}`,
          credentials.apiKey,
          credentials.token,
        );

        for (const lesson of day.lessons) {
          await createCard(
            list.id,
            lesson.title,
            `Section: ${lesson.section}`,
            credentials.apiKey,
            credentials.token,
          );
        }
      }
    } catch (error) {
      setError("Failed to send to Trello. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  if (!apiKey || !token || showCredentials) {
    return (
      <div>
        <h3>Trello Credentials</h3>
        <p>
          To send your study plan to Trello, you need to provide your API key
          and token. You can get them from{" "}
          <a
            href="https://trello.com/app-key"
            target="_blank"
            rel="noopener noreferrer"
          >
            here
          </a>
          .
        </p>
        <div className="plan__form">
          <label htmlFor="trello-api-key">API Key</label>
          <input
            id="trello-api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <label htmlFor="trello-token">Token</label>
          <input
            id="trello-token"
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <button type="button" onClick={() => setShowCredentials(false)}>
            Save
          </button>
        </div>
        {error && <p className="plan__message--error">{error}</p>}
      </div>
    );
  }

  return (
    <>
      <button type="button" onClick={handleSendToTrello} disabled={loading}>
        {loading ? "Sending..." : "Send to Trello"}
      </button>
      {error && <p className="plan__message--error">{error}</p>}
    </>
  );
}
