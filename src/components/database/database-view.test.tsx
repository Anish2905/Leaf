import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { DatabaseView } from "./database-view";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

// Mock toast
vi.mock("sonner", () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}));

// Mock DatabaseBlock extension? No, testing View component directly.

describe("DatabaseView", () => {
    const mockDatabase = {
        id: "db-123",
        title: "Test Database",
        schema: JSON.stringify({ Status: { type: "select", options: [] } }),
    };

    const mockEntries = [
        {
            id: "page-1",
            title: "Entry 1",
            databaseId: "db-123",
            properties: JSON.stringify({ Status: "Done" }),
        },
    ];

    beforeEach(() => {
        fetchMock.mockReset();
    });

    it("renders database title and entries", async () => {
        // Mock API responses
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => mockDatabase,
        });
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ pages: mockEntries }),
        });

        render(<DatabaseView databaseId="db-123" />);

        // Check loading state (might be too fast, but usually renders loading first)
        expect(screen.getByText(/loading/i)).toBeDefined();

        // Check title loaded
        await waitFor(() => {
            expect(screen.getByText("Test Database")).toBeDefined();
        });

        // Check entries
        expect(screen.getByDisplayValue("Entry 1")).toBeDefined();
    });

    it("handles create entry", async () => {
        fetchMock
            .mockResolvedValueOnce({ ok: true, json: async () => mockDatabase })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ pages: [] }) });

        render(<DatabaseView databaseId="db-123" />);

        await waitFor(() => screen.getByText("Test Database"));

        // Find New button
        const newBtn = screen.getByText("New");

        // Mock create response
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ page: { id: "page-2", title: "New Entry" } })
        });

        fireEvent.click(newBtn);

        await waitFor(() => {
            expect(screen.getByDisplayValue("New Entry")).toBeDefined();
        });
    });
});
