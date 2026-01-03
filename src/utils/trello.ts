const TRELLO_API_URL = "https://api.trello.com/1";

export async function createBoard(name: string, apiKey: string, token: string) {
  const url = `${TRELLO_API_URL}/boards?name=${name}&key=${apiKey}&token=${token}&defaultLists=false`;
  const response = await fetch(url, { method: "POST" });
  if (!response.ok) {
    throw new Error("Failed to create Trello board.");
  }
  return response.json();
}

export async function createList(
  boardId: string,
  name: string,
  apiKey: string,
  token: string,
) {
  const url = `${TRELLO_API_URL}/lists?name=${name}&idBoard=${boardId}&key=${apiKey}&token=${token}`;
  const response = await fetch(url, { method: "POST" });
  if (!response.ok) {
    throw new Error("Failed to create Trello list.");
  }
  return response.json();
}

export async function createCard(
  listId: string,
  name: string,
  desc: string,
  apiKey: string,
  token: string,
) {
  const url = `${TRELLO_API_URL}/cards?idList=${listId}&name=${name}&desc=${desc}&key=${apiKey}&token=${token}`;
  const response = await fetch(url, { method: "POST" });
  if (!response.ok) {
    throw new Error("Failed to create Trello card.");
  }
  return response.json();
}
