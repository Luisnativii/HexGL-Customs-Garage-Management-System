const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60000,
  expect: {
    timeout: 10000
  },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    viewport: { width: 1280, height: 720 }
  },
  webServer: {
    command: 'npx http-server -p 4173 -c-1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true
  }
});
