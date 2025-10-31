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

### Expected Behavior

The test will:
- Start Vite dev server on port 8080 (or next available port)
- Load the application in a headless browser
- Filter out expected errors (WebGL errors in headless mode, favicon 404)
- Report any genuine console errors
- Exit with code 0 if no errors, code 1 if errors detected

### Notes

- WebGL errors are expected in headless mode and are filtered out
- Missing favicon.ico is a harmless browser request and is ignored
- The test requires Chromium browser to be installed at `/usr/bin/chromium-browser`
