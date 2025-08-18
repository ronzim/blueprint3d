const puppeteer = require('puppeteer');

jest.setTimeout(60000);

describe('Side Menu', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: 'new' });
    page = await browser.newPage();
    await page.goto('http://localhost:5173/example/index.html', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#floorplanner-canvas'); // wait for app to be ready
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('should switch views when clicking on tabs', async () => {
    // Check initial state (Design tab is active)
    await page.waitForSelector('#viewer', { visible: true });
    await page.waitForSelector('#floorplanner', { hidden: true });
    await page.waitForSelector('#add-items', { hidden: true });

    // Click on the "Edit Floorplan" tab
    await page.click('.nav-sidebar li:nth-child(1)');
    await page.waitForSelector('#floorplanner', { visible: true });
    await page.waitForSelector('#viewer', { hidden: true });
    await page.waitForSelector('#add-items', { hidden: true });

    // Click on the "Design" tab
    await page.click('.nav-sidebar li:nth-child(2)');
    await page.waitForSelector('#viewer', { visible: true });
    await page.waitForSelector('#floorplanner', { hidden: true });
    await page.waitForSelector('#add-items', { hidden: true });

    // Click on the "Add Items" tab
    await page.click('.nav-sidebar li:nth-child(3)');
    await page.waitForSelector('#add-items', { visible: true });
    await page.waitForSelector('#viewer', { hidden: true });
    await page.waitForSelector('#floorplanner', { hidden: true });
  });
});
