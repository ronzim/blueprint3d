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
      const location = msg.location();
      if (msg.type() === 'error' && !location.url.includes('favicon.ico') && !text.includes('runtime.lastError')) {
        errors.push(text);
      }
    });
  });

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
