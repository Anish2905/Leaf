import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";
import { marked } from "marked";

const turndownService = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
});

turndownService.use(gfm);

export function htmlToMarkdown(html: string): string {
    return turndownService.turndown(html);
}

export function markdownToHtml(markdown: string): string {
    // marked.parse returns string | Promise<string> depending on options
    // With defaults, it's string.
    return marked.parse(markdown) as string;
}
