import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("utils", () => {
    it("cn combines class names correctly", () => {
        expect(cn("bg-red-500", "text-white")).toBe("bg-red-500 text-white");
    });

    it("cn handles conditional classes", () => {
        expect(cn("p-4", true && "bg-blue-500", false && "hidden")).toBe(
            "p-4 bg-blue-500"
        );
    });

    it("cn merges tailwind classes correctly", () => {
        expect(cn("p-4 p-2")).toBe("p-2");
        expect(cn("bg-red-500 bg-blue-500")).toBe("bg-blue-500");
    });
});
