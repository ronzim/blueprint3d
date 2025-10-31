/**
 * Test suite to verify that the dev server runs without console errors
 * Uses Puppeteer to launch the application and monitor console messages
 */

const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');

// Configuration
const DEV_SERVER_STARTUP_TIMEOUT = 30000; // 30 seconds
const PAGE_LOAD_TIMEOUT = 15000; // 15 seconds

/**
 * Start the dev server using npm run dev
 * @returns {Promise<Object>} Object containing the child process and URL
 */
async function startDevServer() {
  return new Promise((resolve, reject) => {
    const devServer = spawn('npm', ['run', 'dev'], {
      cwd: process.cwd(),
      stdio: 'pipe',
      shell: true,
    });

    let serverReady = false;
    let serverUrl = 'http://localhost:8080/'; // Default URL
    let outputBuffer = '';
    
    const timeout = setTimeout(() => {
      if (!serverReady) {
        devServer.kill();
        reject(new Error('Dev server failed to start within timeout'));
      }
    }, DEV_SERVER_STARTUP_TIMEOUT);

    devServer.stdout.on('data', (data) => {
      const output = data.toString();
      outputBuffer += output;
      console.log(`[DEV SERVER] ${output}`);
      
      // Extract the URL from Vite output
      const urlMatch = outputBuffer.match(/Local:\s+(http:\/\/localhost:\d+\/)/);
      if (urlMatch) {
        serverUrl = urlMatch[1];
      }
      
      // Check if server is ready - Vite shows "ready in XXX ms"
      if (output.includes('ready in') && !serverReady) {
        serverReady = true;
        clearTimeout(timeout);
        // Give it a bit more time to fully stabilize
        setTimeout(() => {
          console.log(`Server detected at URL: ${serverUrl}`);
          resolve({ process: devServer, url: serverUrl });
        }, 2000);
      }
    });

    devServer.stderr.on('data', (data) => {
      const output = data.toString();
      // Don't log the CJS deprecation warning as error
      if (!output.includes('CJS build') && !output.includes('deprecated')) {
        console.error(`[DEV SERVER ERROR] ${output}`);
      }
    });

    devServer.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    devServer.on('exit', (code) => {
      clearTimeout(timeout);
      if (!serverReady) {
        reject(new Error(`Dev server exited with code ${code}`));
      }
    });
  });
}

/**
 * Main test function
 */
async function runTests() {
  let devServer = null;
  let browser = null;
  let testsPassed = true;
  const consoleErrors = [];
  const consoleWarnings = [];

  try {
    console.log('Starting dev server...');
    const { process: devServerProcess, url: serverUrl } = await startDevServer();
    devServer = devServerProcess;
    console.log(`Dev server started successfully at ${serverUrl}`);

    console.log('Launching browser...');
    browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
      headless: true,
    });

    const page = await browser.newPage();

    // Listen for failed requests to get more details about 404 errors
    page.on('response', (response) => {
      if (response.status() === 404) {
        const url = response.url();
        // Ignore favicon.ico 404s as they're harmless
        if (!url.includes('favicon.ico')) {
          const error = `Failed to load resource: ${url} (404 Not Found)`;
          consoleErrors.push(error);
          console.error(`[BROWSER ERROR] ${error}`);
        } else {
          console.log(`[INFO] Ignoring expected favicon.ico 404`);
        }
      }
    });

    // Listen for console messages
    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        // Filter out expected errors in headless mode and generic 404 messages
        const isWebGLError = text.includes('WebGL') || text.includes('getShaderPrecisionFormat');
        const isGeneric404 = text.includes('Failed to load resource: the server responded with a status of 404');
        
        if (!isWebGLError && !isGeneric404) {
          consoleErrors.push(text);
          console.error(`[BROWSER ERROR] ${text}`);
        } else if (isWebGLError) {
          console.log(`[BROWSER ERROR (Expected in headless)] ${text}`);
        }
        // Skip logging generic 404s as we handle them via response listener
      } else if (type === 'warning') {
        consoleWarnings.push(text);
        console.warn(`[BROWSER WARNING] ${text}`);
      } else {
        console.log(`[BROWSER ${type.toUpperCase()}] ${text}`);
      }
    });

    // Listen for page errors
    page.on('pageerror', (error) => {
      // Filter out expected WebGL errors in headless mode
      const isWebGLError = error.message.includes('WebGL') || 
                          error.message.includes('getShaderPrecisionFormat') ||
                          error.message.includes('getContext');
      if (!isWebGLError) {
        consoleErrors.push(error.message);
        console.error(`[PAGE ERROR] ${error.message}`);
      } else {
        console.log(`[PAGE ERROR (Expected in headless)] ${error.message}`);
      }
    });

    console.log(`Navigating to ${serverUrl}example/index.html...`);
    await page.goto(`${serverUrl}example/index.html`, {
      waitUntil: 'networkidle2',
      timeout: PAGE_LOAD_TIMEOUT,
    });

    console.log('Page loaded successfully');

    // Wait a bit more to catch any delayed errors
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check results
    console.log('\n=== Test Results ===');
    console.log(`Console Errors: ${consoleErrors.length}`);
    console.log(`Console Warnings: ${consoleWarnings.length}`);

    if (consoleErrors.length > 0) {
      console.error('\n❌ FAILED: Console errors detected:');
      consoleErrors.forEach((error, index) => {
        console.error(`  ${index + 1}. ${error}`);
      });
      testsPassed = false;
    } else {
      console.log('\n✅ PASSED: No console errors detected');
    }

    if (consoleWarnings.length > 0) {
      console.warn('\n⚠️  Console warnings detected:');
      consoleWarnings.forEach((warning, index) => {
        console.warn(`  ${index + 1}. ${warning}`);
      });
    }

  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    testsPassed = false;
  } finally {
    // Cleanup
    if (browser) {
      console.log('\nClosing browser...');
      await browser.close();
    }

    if (devServer) {
      console.log('Stopping dev server...');
      devServer.kill('SIGTERM');
      
      // Give it time to gracefully shutdown
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Force kill if still running
      if (!devServer.killed) {
        devServer.kill('SIGKILL');
      }
    }

    console.log('\n=== Test Completed ===\n');
    process.exit(testsPassed ? 0 : 1);
  }
}

// Run the tests
runTests();
