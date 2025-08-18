from playwright.sync_api import sync_playwright, Page, expect
import time

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # 1. Arrange: Go to the application.
        page.goto("http://127.0.0.1:3000/docs/")

        # 2. Act: Click the "Add Items" tab.
        add_items_tab = page.locator("#items_tab a")
        add_items_tab.click()

        # Wait for a moment to ensure the UI has updated
        time.sleep(2)

        # 3. Act: Click the "Red Chair" item.
        red_chair_item = page.locator('a.add-item[model-name="Red Chair"]')
        red_chair_item.click(force=True) # Force the click even if not visible

        # 4. Assert: Wait for the item to be added to the scene.
        loading_modal = page.locator("#loading-modal")
        expect(loading_modal).to_be_hidden(timeout=10000)

        # 5. Screenshot: Capture the final result for visual verification.
        page.screenshot(path="jules-scratch/verification/add_item_verification.png")

        browser.close()

if __name__ == "__main__":
    main()
