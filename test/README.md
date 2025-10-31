# Test Suite

This directory contains automated tests for the Blueprint3D application.

## Console Error Test

**File:** `console-errors.test.js`

This test uses Puppeteer to:
1. Start the development server using `npm run dev`
2. Launch a headless Chromium browser
3. Navigate to the application
4. Monitor console messages for errors
5. Report any unexpected console errors

### Running the Test

```bash
npm test
```

### Browser Requirements

The test automatically detects Chrome/Chromium installations in common locations:
- Linux: `/usr/bin/chromium-browser`, `/usr/bin/chromium`, `/usr/bin/google-chrome`, etc.
- macOS: `/Applications/Google Chrome.app`, `/Applications/Chromium.app`
- Windows: `C:\Program Files\Google\Chrome\Application\chrome.exe`

If the browser is installed in a non-standard location, set the `PUPPETEER_EXECUTABLE_PATH` environment variable:

```bash
PUPPETEER_EXECUTABLE_PATH=/path/to/chrome npm test
```

To install a browser:
- **Linux**: `sudo apt install chromium-browser` or `sudo apt install google-chrome-stable`
- **macOS**: Download from [google.com/chrome](https://www.google.com/chrome)
- **Windows**: Download from [google.com/chrome](https://www.google.com/chrome)

### Expected Behavior

The test will:
- Start Vite dev server on port 8080 (or next available port)
- Wait 5 seconds for the server to stabilize before launching browser
- Load the application in a headless browser
- Filter out expected errors (WebGL errors in headless mode, favicon 404)
- Report any genuine console errors
- Exit with code 0 if no errors, code 1 if errors detected

### Notes

- WebGL errors are expected in headless mode and are filtered out
- Missing favicon.ico is a harmless browser request and is ignored
- A 5-second delay after server startup ensures proper initialization before testing

