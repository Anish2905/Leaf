import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BookmarkComponent } from "./bookmark";

// Mock fetch global
global.fetch = vi.fn();

describe("BookmarkComponent", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("renders loading state initially", () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ title: "Test", description: "Desc", image: "" }),
        });

        render(<BookmarkComponent node={{ attrs: { url: "https://example.com" } }} />);
        expect(screen.getByText(/Fetching metadata/i)).toBeInTheDocument();
    });

    it("renders metadata after fetch", async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                title: "Example Domain",
                description: "This is an example",
                image: "https://example.com/image.png",
            }),
        });

        render(<BookmarkComponent node={{ attrs: { url: "https://example.com" } }} />);

        await waitFor(() => {
            expect(screen.getByText("Example Domain")).toBeInTheDocument();
            expect(screen.getByText("This is an example")).toBeInTheDocument();
            expect(screen.getByAltText("")).toHaveAttribute("src", "https://example.com/image.png");
        });
    });

    it("renders url on error", async () => {
        (global.fetch as any).mockRejectedValueOnce(new Error("Failed"));

        render(<BookmarkComponent node={{ attrs: { url: "https://example.com" } }} />);

        await waitFor(() => {
            expect(screen.getByText("https://example.com")).toBeInTheDocument();
        });
    });
});
