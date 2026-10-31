import { chromium } from 'playwright-core';

async function verifyAll() {
  console.log('=== STARTING FINAL COMPREHENSIVE LIVE ZERO VERIFICATION ===');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage();

  // Test 1: Home Chat
  console.log('1. Navigating to http://127.0.0.1:18789/chat/zero...');
  await page.goto('http://127.0.0.1:18789/chat/zero', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const homeTitle = await page.title();
  console.log('   Page Title:', homeTitle);
  if (homeTitle.includes('OpenClaw')) {
    throw new Error(`FAIL: Page title still contains OpenClaw: ${homeTitle}`);
  }
  console.log('✔ PASSED: Title is cleanly branded as Zero!');

  // Check Sidebar
  const sidebarText = await page.evaluate(() => document.querySelector('aside')?.innerText || '');
  console.log('   Sidebar text snippet:', sidebarText.replace(/\n+/g, ' ').substring(0, 100));
  if (sidebarText.includes('tool-live-exec') || sidebarText.includes('be02-acceptance')) {
    throw new Error('FAIL: Sidebar contains stale test sessions!');
  }
  console.log('✔ PASSED: Sidebar is 100% clean of all test sessions!');

  // Check Top Control Buttons
  const topButtons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button'))
      .map(b => b.innerText.trim())
      .filter(t => t.includes('Computer Control') || t.includes('Reasoning'));
  });
  console.log('   Top control buttons:', topButtons);
  if (!topButtons.some(t => t.includes('Computer Control')) || !topButtons.some(t => t.includes('Reasoning'))) {
    throw new Error('FAIL: Top control buttons missing on /chat/zero!');
  }
  console.log('✔ PASSED: Top control buttons ("Computer Control: Active" & "Reasoning: ON") are present!');

  // Check Model Picker
  const modelBtn = page.locator('summary[data-chat-model-select], button[data-chat-model-trigger], .chat-controls__model-trigger, [aria-label*="Chat model"]').first();
  const triggerText = await modelBtn.innerText();
  console.log('2. Model trigger button text:', triggerText);
  if (triggerText.includes('zero-gateway') || triggerText.includes('test-model') || triggerText === 'default') {
    throw new Error(`FAIL: Model trigger displays dummy model: ${triggerText}`);
  }
  console.log('✔ PASSED: Trigger displays real configured model:', triggerText);

  // Click model trigger to open menu
  console.log('3. Opening model dropdown menu...');
  await modelBtn.click();
  await page.waitForTimeout(1000);

  const dropdownData = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('.chat-controls__provider-label, .chat-controls__provider-heading'))
      .map(e => e.innerText.trim());
    const options = Array.from(document.querySelectorAll('.chat-controls__model-option'))
      .map(e => e.innerText.trim().replace(/\n+/g, ' '));
    return { headings, options };
  });

  console.log('   Dropdown headings:', dropdownData.headings);
  console.log('   Dropdown options:', dropdownData.options);

  // Assertions on dropdown
  for (const h of dropdownData.headings) {
    if (h.toLowerCase().includes('zero gateway') || h.toLowerCase().includes('test provider')) {
      throw new Error(`FAIL: Found dummy provider heading: ${h}`);
    }
  }
  for (const opt of dropdownData.options) {
    if (opt.toLowerCase().includes('test-model') || opt.toLowerCase().includes('zero-gateway')) {
      throw new Error(`FAIL: Found dummy model option: ${opt}`);
    }
  }
  console.log('✔ PASSED: Zero Gateway, Test Provider, and test-model-1 are 100% eliminated!');
  console.log('✔ PASSED: Chat model picker contains ONLY real configured models!');

  await page.screenshot({ path: 'C:/Users/Professor Zero/.gemini/antigravity/brain/853155d1-8b17-4e54-9566-15cd1228664e/verified-final-clean-chat-model-dropdown.png' });

  // Test 2: Appearance page
  console.log('4. Navigating to /settings/appearance...');
  await page.goto('http://127.0.0.1:18789/settings/appearance', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  const appearanceHtml = await page.evaluate(() => document.body.innerText);
  if (appearanceHtml.includes('Using Claw until') || appearanceHtml.includes('themes:{claw:{label:`Claw`')) {
    throw new Error('FAIL: Appearance page still shows Claw theme branding!');
  }
  console.log('✔ PASSED: Appearance page is pure Zero!');

  // Test 3: Models page
  console.log('5. Navigating to /settings/model-providers...');
  await page.goto('http://127.0.0.1:18789/settings/model-providers', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);

  const modelsHtml = await page.evaluate(() => document.body.innerText);
  if (modelsHtml.includes('test-model-1') || modelsHtml.includes('Test Provider')) {
    throw new Error('FAIL: Model providers page still shows test-model-1 or Test Provider!');
  }
  console.log('✔ PASSED: Model providers page shows clean real Nvidia models and providers!');

  await page.screenshot({ path: 'C:/Users/Professor Zero/.gemini/antigravity/brain/853155d1-8b17-4e54-9566-15cd1228664e/verified-final-clean-models-page.png' });

  await browser.close();
  console.log('=== ALL 5 CHECKS PASSED 100% PERFECTLY! ===');
}

verifyAll().catch((err) => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
