import { useState } from "react";
import { useLocalStorage } from "./useLocalStorage";

export function useTrello() {
  const [apiKey, setApiKey] = useLocalStorage("trello-api-key", "");
  const [token, setToken] = useLocalStorage("trello-token", "");
  const [error, setError] = useState<string | null>(null);

  const getTrelloCredentials = () => {
    if (!apiKey || !token) {
      setError("Trello API key and token are required.");
      return null;
    }
    return { apiKey, token };
  };

  return {
    apiKey,
    setApiKey,
    token,
    setToken,
    error,
    getTrelloCredentials,
  };
}
