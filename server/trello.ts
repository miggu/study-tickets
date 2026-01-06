import { type Request, type Response } from "express";
import fs from "node:fs";
import path from "node:path";
import { type PlanDay, type LessonDTO, type TrelloLabel, type TrelloList } from "./types.js";

let trelloCredentials: { apiKey: string; token: string } | null = null;

function loadTrelloCredentials() {
  const envApiKey = process.env.TRELLO_API_KEY;
  const envToken = process.env.TRELLO_TOKEN;

  // Prioritize environment variables for production
  if (envApiKey && envToken) {
    trelloCredentials = { apiKey: envApiKey, token: envToken };
    if (process.env.DEBUG_TRELLO === 'true') console.log("[SERVER] Trello credentials loaded from environment variables.");
    return;
  }

  // Fallback to JSON file for local development
  const secretsPath = path.join(
    process.cwd(),
    "dev-untracked",
    "trello-secrets.json",
  );
  try {
    const data = fs.readFileSync(secretsPath, "utf8");
    trelloCredentials = JSON.parse(data);
    if (process.env.DEBUG_TRELLO === 'true') console.log("[SERVER] Trello credentials loaded from dev-untracked/trello-secrets.json.");
  } catch (error) {
    if (process.env.DEBUG_TRELLO === 'true') console.warn(
      "[SERVER] Could not load Trello credentials from environment variables or dev-untracked/trello-secrets.json:",
      error instanceof Error ? error.message : String(error),
    );
    trelloCredentials = null; // Ensure it's null if loading fails
  }
}

// Load credentials on server startup
loadTrelloCredentials();

const durationToSeconds = (duration?: string | null): number | null => {
  if (!duration) return null;
  const lower = duration.toLowerCase();
  if (lower.includes("question")) return 0;

  // mm:ss or hh:mm:ss
  const colonParts = duration.split(":").map((p) => Number(p));
  if (
    colonParts.length >= 2 &&
    colonParts.length <= 3 &&
    !colonParts.some((n) => Number.isNaN(n))
  ) {
    if (colonParts.length === 3) {
      return colonParts[0] * 3600 + colonParts[1] * 60 + colonParts[2];
    }
    return colonParts[0] * 60 + colonParts[1];
  }

  const hmsMatch = lower.match(
    /(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?/,
  );
  if (hmsMatch) {
    const h = Number(hmsMatch[1] || 0);
    const m = Number(hmsMatch[2] || 0);
    const s = Number(hmsMatch[3] || 0);
    if (
      !Number.isNaN(h) &&
      !Number.isNaN(m) &&
      !Number.isNaN(s) &&
      (h || m || s)
    ) {
      return h * 3600 + m * 60 + s;
    }
  }

  const asNumber = Number(duration);
  if (!Number.isNaN(asNumber) && asNumber > 0) {
    return asNumber * 60;
  }

  return null;
};

const formatDuration = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${hours}h`;
  }

  return `${minutes}m`;
};

export const createTrelloBoardHandler = async (req: Request, res: Response) => {
  if (!trelloCredentials) {
    return res.status(500).send("Trello credentials not loaded on server.");
  }

  const { apiKey, token } = trelloCredentials;
  const {
    courseTitle,
    plan,
  }: {
    courseTitle: string;
    plan: PlanDay[];
  } = req.body;

  if (!courseTitle || !plan) {
    return res.status(400).send("Missing required parameters.");
  }

  // --- Debug File: Request Payload ---
  if (process.env.DEBUG_TRELLO === "true") {
    try {
      const payloadPath = path.join(
        process.cwd(),
        "dev-untracked",
        "trello-request-payload.json",
      );
      fs.writeFileSync(
        payloadPath,
        JSON.stringify({ courseTitle, plan }, null, 2),
        "utf8",
      );
      console.log("[SERVER] Wrote Trello request payload to debug file.");
    } catch (debugError) {
      console.warn(
        "[SERVER] Failed to write Trello request debug file:",
        debugError,
      );
    }
  }
  // --- End Debug File ---

  const TRELLO_API_URL = "https://api.trello.com/1";

  try {
    // Step 1: Create the board
    if (process.env.DEBUG_TRELLO === "true")
      console.log("[TRELLO] Creating board...");
    const boardResponse = await fetch(
      `${TRELLO_API_URL}/boards?name=${encodeURIComponent(
        courseTitle,
      )}&key=${apiKey}&token=${token}&defaultLists=false&defaultLabels=true`, // Ensure default labels are created
      { method: "POST" },
    );
    if (!boardResponse.ok) {
      const errorText = await boardResponse.text();
      console.error("[TRELLO] Raw error from Trello API:", errorText);
      throw new Error(
        `Failed to create Trello board. Trello says: ${errorText}`,
      );
    }
    const board = await boardResponse.json();
    if (process.env.DEBUG_TRELLO === "true")
      console.log(`[TRELLO] Board created with ID: ${board.id}`);

    // --- Debug File: Board Response ---
    if (process.env.DEBUG_TRELLO === "true") {
      try {
        const responsePath = path.join(
          process.cwd(),
          "dev-untracked",
          "trello-board-response.json",
        );
        fs.writeFileSync(responsePath, JSON.stringify(board, null, 2), "utf8");
        console.log("[SERVER] Wrote Trello board response to debug file.");
      } catch (debugError) {
        console.warn(
          "[SERVER] Failed to write Trello response debug file:",
          debugError,
        );
      }
    }
    // --- End Debug File ---

    // Step 2: Get the board's labels to find the 'red' one
    if (process.env.DEBUG_TRELLO === "true")
      console.log("[TRELLO] Getting board labels...");
    const labelsResponse = await fetch(
      `${TRELLO_API_URL}/boards/${board.id}/labels?key=${apiKey}&token=${token}`,
    );
    if (!labelsResponse.ok) throw new Error("Failed to get board labels.");
    const labels = await labelsResponse.json();
    const redLabel = labels.find((label: TrelloLabel) => label.color === "red");
    const redLabelId = redLabel ? redLabel.id : null;
    if (process.env.DEBUG_TRELLO === "true") {
      if (redLabelId)
        console.log(`[TRELLO] Found red label with ID: ${redLabelId}`);
      else console.warn("[TRELLO] Could not find a default red label.");
    }

    // Step 3: Create all "Day" lists sequentially to preserve order
    if (process.env.DEBUG_TRELLO === "true")
      console.log("[TRELLO] Creating Day lists sequentially...");
    const dayLists: TrelloList[] = [];
    for (const day of plan) {
      const listResponse = await fetch(
        `${TRELLO_API_URL}/lists?name=${encodeURIComponent(
          `Day ${day.day}`,
        )}&idBoard=${board.id}&key=${apiKey}&token=${token}&pos=bottom`,
        { method: "POST" },
      );
      if (!listResponse.ok)
        throw new Error(`Failed to create list for Day ${day.day}.`);
      const list = await listResponse.json();
      dayLists.push(list);
    }
    if (process.env.DEBUG_TRELLO === "true")
      console.log(`[TRELLO] ${dayLists.length} Day lists created.`);

    // Step 4: Group lessons by section for each day
    const dailySections = plan.map((day) => {
      const sectionsMap = new Map<string, LessonDTO[]>();
      day.lessons.forEach((lesson: LessonDTO) => {
        if (!sectionsMap.has(lesson.section)) {
          sectionsMap.set(lesson.section, []);
        }
        sectionsMap.get(lesson.section)!.push(lesson);
      });
      return {
        day: day.day,
        listId: dayLists.find((list) => list.name === `Day ${day.day}`)!.id,
        sections: Array.from(sectionsMap.entries()),
      };
    });

    // Step 5: Create cards, checklists, and checklist items sequentially to avoid rate limits
    if (process.env.DEBUG_TRELLO === "true")
      console.log(
        "[TRELLO] Creating Section-Day cards and their checklists sequentially...",
      );

    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

    for (const { day, listId, sections } of dailySections) {
      for (const [sectionTitle, lessons] of sections) {
        // A. Calculate total duration for this chunk of lessons
        const totalSeconds = lessons.reduce(
          (sum, lesson) => sum + (durationToSeconds(lesson.duration) ?? 0),
          0,
        );
        const formattedDuration = formatDuration(totalSeconds);
        const cardTitle = `${sectionTitle} - ${formattedDuration}`;

        // B. Determine if this card needs a red label
        const hasLongLesson = lessons.some(
          (lesson) => (durationToSeconds(lesson.duration) ?? 0) > 600,
        );
        let cardUrl = `${TRELLO_API_URL}/cards?idList=${listId}&name=${encodeURIComponent(
          cardTitle,
        )}&key=${apiKey}&token=${token}`;
        if (redLabelId && hasLongLesson) {
          cardUrl += `&idLabels=${redLabelId}`;
        }

        // C. Create the card for the daily section
        const cardResponse = await fetch(cardUrl, { method: "POST" });
        if (!cardResponse.ok) {
          const errorText = await cardResponse.text();
          console.error(
            `[TRELLO] Raw card creation error for ${cardTitle}:`,
            errorText,
          );
          throw new Error(
            `Failed to create card for ${sectionTitle} - Day ${day}. Trello says: ${errorText}`,
          );
        }
        const card = await cardResponse.json();

        // D. Create a checklist on that card
        const checklistResponse = await fetch(
          `${TRELLO_API_URL}/checklists?idCard=${card.id}&name=Lessons&key=${apiKey}&token=${token}`,
          { method: "POST" },
        );
        if (!checklistResponse.ok) {
          const errorText = await checklistResponse.text();
          console.error(
            `[TRELLO] Raw checklist creation error for card ${card.name}:`,
            errorText,
          );
          throw new Error(
            `Failed to create checklist for ${card.name}. Trello says: ${errorText}`,
          );
        }
        const checklist = await checklistResponse.json();

        // E. Add all lessons for that daily section to the checklist in parallel
        const checklistItemPromises = lessons.map((lesson) =>
          fetch(
            `${TRELLO_API_URL}/checklists/${checklist.id}/checkItems?name=${encodeURIComponent(
              `${lesson.title} - ${lesson.duration}`,
            )}&key=${apiKey}&token=${token}`,
            { method: "POST" },
          ),
        );
        await Promise.all(checklistItemPromises);

        if (process.env.DEBUG_TRELLO === "true")
          console.log(`[TRELLO] Finished processing card: ${card.name}`);
        await delay(100); // Add a small delay to be polite to the API
      }
    }

    if (process.env.DEBUG_TRELLO === "true")
      console.log(`[TRELLO] All cards and checklist items created.`);

    res.json({ ok: true, boardUrl: board.url });
  } catch (error) {
    console.error("Trello integration failed:", error);
    const message =
      error instanceof Error ? error.message : "An unknown error occurred.";
    res.status(500).send(message);
  }
};
