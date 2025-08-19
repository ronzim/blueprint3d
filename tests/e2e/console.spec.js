const puppeteer = require('puppeteer');

describe('E2E Console Errors', () => {
  let browser;
  let page;
  const errors = [];

  beforeAll(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();

    page.on('console', msg => {
      const text = msg.text();
      const url = msg.location().url;
      if (msg.type() === 'error' && !url.includes('favicon.ico') && !text.includes('runtime.lastError')) {
        errors.push(`Error: "${text}" at ${url}`);
      }
    });
  }, 60000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('should not have console errors', async () => {
    await page.goto('http://localhost:5173/example/index.html');
    await new Promise(resolve => setTimeout(resolve, 10000));
    expect(errors).toEqual([]);
  }, 60000);
});
