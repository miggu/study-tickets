import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, it, expect, vi, beforeEach } from "vitest";
import App from "../src/App";

// Mock the useLocalStorage hook
vi.mock("../src/hooks/useLocalStorage", () => ({
  useLocalStorage: () => [
    vi.fn(() => null), // Mock readStorage to return null (no cache)
    vi.fn(), // Mock writeStorage
  ],
}));

// Helper for a valid course URL
const mockCourseUrl = "https://www.udemy.com/course/mock-course/";

describe("App", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchSpy = vi.spyOn(global, "fetch");
  });

  afterEach(() => {
    cleanup();
    fetchSpy.mockRestore();
  });

  it("renders the hero header and course input initially", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", {
        name: /Turn a course URL into a Trello-ready lesson list./i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Course URL/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Ready. Paste a URL and extract./i),
    ).toBeInTheDocument();
  });

  it("shows an error for an invalid Udemy course URL", async () => {
    render(<App />);
    const urlInput = screen.getByLabelText(/Course URL/i);
    const extractButton = screen.getByRole("button", { name: /extract/i });

    await userEvent.type(urlInput, "invalid-url");
    await userEvent.click(extractButton);

    expect(
      screen.getByText(/Enter a valid Udemy course URL./i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Waiting for a valid course URL./i),
    ).not.toBeInTheDocument();
  });

  it("successfully fetches and displays course data from API", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          courseTitle: "Test Course",
          sections: [
            {
              title: "Section A",
              timeRequired: "5:00",
              lessons: [
                {
                  id: "1",
                  title: "Lesson 1",
                  duration: "00:05:00",
                },
              ],
            },
          ],
        }),
    });

    render(<App />);
    const urlInput = screen.getByLabelText(/Course URL/i);
    const extractButton = screen.getByRole("button", { name: /extract/i });

    await userEvent.type(urlInput, mockCourseUrl);
    await userEvent.click(extractButton);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Test Course/i, level: 2 }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Done. Parsed 1 lessons from API./i),
      ).toBeInTheDocument();
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/api/curriculum?url="),
      );
    });
  });

  it("handles API fetch error gracefully", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: () => Promise.resolve("Not Found"),
    });

    render(<App />);
    const urlInput = screen.getByLabelText(/Course URL/i);
    const extractButton = screen.getByRole("button", { name: /extract/i });

    await userEvent.type(urlInput, mockCourseUrl);
    await userEvent.click(extractButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Fetching curriculum failed \(404\). Not Found/i),
      ).toBeInTheDocument();
      expect(screen.queryByText(/No lessons found./i)).not.toBeInTheDocument();
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });
  });

  // More tests would go here, e.g., for caching, removeSection, removeLesson
});
