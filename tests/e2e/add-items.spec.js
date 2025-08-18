const puppeteer = require('puppeteer');

jest.setTimeout(60000);

describe('Add Items Tab', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: 'new' });
    page = await browser.newPage();
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('should add an item to the scene', async () => {
    await page.goto('http://localhost:5173/example/index.html', { waitUntil: 'networkidle2' });

    // Click on the "Add Items" tab
    await page.waitForSelector('#items_tab');
    await page.click('#items_tab');

    // Wait for the Vue component to render the items
    await page.waitForSelector('.add-item', { visible: true });

    // Click on the first item
    await page.evaluate(() => {
      document.querySelector('.add-item').click();
    });

    // Verify that the view switches back to the "Design" tab
    await page.waitForSelector('#design_tab.active');

    const designTabIsActive = await page.$eval('#design_tab', el => el.classList.contains('active'));
    expect(designTabIsActive).toBe(true);
  });
});
