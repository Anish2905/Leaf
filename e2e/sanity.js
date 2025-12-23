const puppeteer = require('puppeteer-core');
const assert = require('assert');

(async () => {
    console.log('Starting E2E Sanity Check...');
    let browser;
    try {
        browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            headless: true
        });
        const page = await browser.newPage();

        console.log('Navigating to homepage...');
        const response = await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle0' });
        console.log(`Response Status: ${response.status()}`);


        const title = await page.title();
        console.log(`Page Title: ${title}`);
        console.log(`Current URL: ${page.url()}`);
        assert.ok(title, 'Title should be present');

        // Check if we are on login page
        if (page.url().includes('/login')) {
            console.log('Redirected to login page (Expected)');
            // Check for login form components
            // Try to find "Login" text or button
            // Just enable loose check
            const content = await page.content();
            assert.ok(content.includes('Login') || content.includes('Sign in') || content.includes('Polar Stellar'), 'Should show login content');
        } else {
            // Basic check for sidebar or content
            const sidebar = await page.$('.bg-sidebar');
            assert.ok(sidebar, 'Sidebar should be present');
        }

        console.log('E2E Sanity Check Passed!');
    } catch (error) {
        console.error('E2E Test Failed:', error);
        if (browser) {
            const pages = await browser.pages();
            if (pages.length > 0) {
                const content = await pages[0].content();
                console.error('Page Content (First 500 chars):', content.substring(0, 500));
            }
        }
        process.exit(1);
    } finally {
        if (browser) await browser.close();
    }
})();
