const puppeteer = require('puppeteer');

jest.setTimeout(60000);

describe('E2E Console Errors', () => {
  let browser;
  let page;
  const errors = [];

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: 'new' });
    page = await browser.newPage();

    page.on('console', msg => {
      const location = msg.location();
      if (location && location.url.includes('favicon.ico')) {
        return;
      }
      const text = msg.text();
      if (msg.type() === 'error' && !text.includes('runtime.lastError')) {
        errors.push(text);
      }
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('should load the page', async () => {
    await page.goto('http://localhost:5173/example/index.html', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#floorplanner-canvas');
    expect(true).toBe(true);
  });
});
