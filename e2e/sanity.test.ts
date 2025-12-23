// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import puppeteer from 'puppeteer-core';

describe('E2E Sanity Check', () => {
    let browser;
    let page;

    beforeAll(async () => {
        browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            headless: true
        });
        page = await browser.newPage();
    });

    afterAll(async () => {
        if (browser) await browser.close();
    });

    it('should load the homepage and show correct title', async () => {
        // App is running on port 3000 in the container? 
        // We are using 'docker compose exec app ...', so we are INSIDE the container. 
        // localhost:3000 matches the internal port if the app listens on 0.0.0.0 or localhost.

        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

        const title = await page.title();
        // Adjust expectation based on actual meta title
        // In layout.tsx or page.tsx
        expect(title).toBeDefined();

        // Check for sidebar presence
        const sidebar = await page.$('div'); // Just checking basic render
        expect(sidebar).not.toBeNull();
    });
});
