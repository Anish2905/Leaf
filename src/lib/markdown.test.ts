import { describe, it, expect } from "vitest";
import { htmlToMarkdown, markdownToHtml } from "./markdown";

describe("Markdown Utils", () => {
    it("converts HTML to Markdown (basic)", () => {
        const html = "<p>Hello <strong>World</strong></p>";
        const md = htmlToMarkdown(html);
        expect(md).toBe("Hello **World**");
    });

    it("converts HTML to Markdown (tables)", () => {
        const html = `
            <table>
                <thead>
                    <tr><th>A</th><th>B</th></tr>
                </thead>
                <tbody>
                    <tr><td>1</td><td>2</td></tr>
                </tbody>
            </table>
        `;
        const md = htmlToMarkdown(html);
        expect(md).toContain("| A | B |");
        expect(md).toContain("| --- | --- |");
        expect(md).toContain("| 1 | 2 |");
    });

    it("converts HTML to Markdown (task list)", () => {
        const html = `<ul><li><input type="checkbox" checked> Item 1</li><li><input type="checkbox"> Item 2</li></ul>`;
        const md = htmlToMarkdown(html);
        // Note: Turndown GFM output for task lists might vary slightly, checking essential parts
        expect(md).toMatch(/- +\[x] +Item 1/);
        expect(md).toMatch(/- +\[ ] +Item 2/);
    });

    it("converts Markdown to HTML", () => {
        const md = "# Title\n\n- Item 1";
        const html = markdownToHtml(md);
        expect(html).toContain("Title</h1>");
        expect(html).toContain("<h1>"); // May or may not have id
        expect(html).toContain("<ul>");
        expect(html).toContain("<li>Item 1</li>");
    });
});
