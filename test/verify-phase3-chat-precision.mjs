import { chromium } from '../backend/node_modules/.pnpm/playwright-core@1.63.0/node_modules/playwright-core/index.mjs';

async function verifyPhase3PrecisionControl() {
  console.log('=== STARTING PHASE 3 CHAT SECTION PRECISION OS TEST ===');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage();
  
  await page.goto('http://127.0.0.1:18789/chat/zero', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  console.log('1. Page loaded. Title:', await page.title());

  // Find composer in Chat Section
  const composer = await page.waitForSelector('textarea[placeholder*="Message Zero"]', { timeout: 10000 });
  console.log('2. Found Chat Composer.');

  // User instruction as required:
  // "Notepad (ya Calculator) open karo, UIA Root Tree se uske interactive elements inspect karo, aur usme 'Zero OS Root Tree Verified' type karke dikhao."
  const prompt = "Notepad open karo, UIA Root Tree se uske interactive elements inspect karo, aur usme 'Zero OS Root Tree Verified' type karke dikhao.";
  console.log('3. Typing prompt into Chat Section:', prompt);
  await composer.fill(prompt);
  await page.keyboard.press('Enter');

  // Wait for the workflow to complete and response to contain the verification header
  console.log('4. Waiting for agent to launch Notepad, inspect UIA Root Tree, type text, and report...');
  await page.waitForFunction(() => {
    const text = document.body.innerText;
    return text.includes('Precision OS Control & UIA Root Tree Execution Verified') ||
           text.includes('UIA Root Tree Execution Verified');
  }, { timeout: 35000 });
  await page.waitForTimeout(2000);

  // Extract recent response
  const recentText = await page.evaluate(() => {
    const bubbles = Array.from(document.querySelectorAll('.chat-bubble, .message-bubble, .chat-text, [data-message-role]'));
    return bubbles.map(b => b.innerText.trim()).filter(Boolean);
  });

  // Find the bubble that contains the verification report
  const reportBubble = recentText.reverse().find(t => t.includes('Precision OS Control & UIA Root Tree Execution Verified')) || '';
  console.log('5. Agent Response in Chat Section:\n----------------------------------------\n' + reportBubble + '\n----------------------------------------');

  const containsPrecisionReport = reportBubble.includes('Precision OS Control & UIA Root Tree Execution Verified');
  console.log('6. Verified Precision OS Control & UIA Response:', containsPrecisionReport ? 'PASSED ✅' : 'FAILED ❌');
  if (!containsPrecisionReport) {
    throw new Error('Response did not contain expected Precision OS Control / UIA verification output!');
  }

  // Take screenshot of the live chat with verification
  await page.screenshot({ path: 'E:/zero/phase3-chat-precision-verified.png', fullPage: true });
  console.log('7. Saved screenshot to E:/zero/phase3-chat-precision-verified.png');

  await browser.close();
  console.log('=== PHASE 3 CHAT VERIFICATION COMPLETED SUCCESSFULLY ===');
}

verifyPhase3PrecisionControl().catch(err => {
  console.error('Phase 3 verification error:', err);
  process.exit(1);
});
