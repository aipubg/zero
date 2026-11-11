import { chromium } from '../backend/node_modules/.pnpm/playwright-core@1.63.0/node_modules/playwright-core/index.mjs';

async function verifyPhase4PinchTab() {
  console.log('=== STARTING PHASE 4 CHAT SECTION PINCHTAB TEST ===');
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

  // User instruction as required in Phase 4:
  // "Browser open karo, GitHub ya Google par jao, PinchTab snapshot se search box ka exact ref ID (e...) dhundo, usme 'Zero AI Autonomous Agent' type karke search karo aur result verify karo."
  const prompt = "Browser open karo, Google par jao, PinchTab snapshot se search box ka exact ref ID (e...) dhundo, usme 'Zero AI Autonomous Agent' type karke search karo aur result verify karo.";
  console.log('3. Typing prompt into Chat Section:', prompt);
  await composer.fill(prompt);
  await page.keyboard.press('Enter');

  // Wait for the workflow to complete and response to contain the verification header
  console.log('4. Waiting for agent to execute PinchTab workflow, extract snapshot refs, and report...');
  await page.waitForFunction(() => {
    const text = document.body.innerText;
    return text.includes('PinchTab Deterministic Browser Automation Verified') ||
           text.includes('PinchTab Verification Complete');
  }, { timeout: 45000 });
  await page.waitForTimeout(2000);

  // Extract recent response
  const recentText = await page.evaluate(() => {
    const bubbles = Array.from(document.querySelectorAll('.chat-bubble, .message-bubble, .chat-text, [data-message-role]'));
    return bubbles.map(b => b.innerText.trim()).filter(Boolean);
  });

  // Find the bubble that contains the verification report
  const reportBubble = recentText.reverse().find(t => t.includes('PinchTab Deterministic Browser Automation Verified')) || '';
  console.log('5. Agent Response in Chat Section:\n----------------------------------------\n' + reportBubble + '\n----------------------------------------');

  const containsPinchTabReport = reportBubble.includes('PinchTab Deterministic Browser Automation Verified') && reportBubble.includes('Resolved Input Ref ID');
  console.log('6. Verified PinchTab Ref-based Response:', containsPinchTabReport ? 'PASSED ✅' : 'FAILED ❌');
  if (!containsPinchTabReport) {
    throw new Error('Response did not contain expected PinchTab verification output!');
  }

  // Take screenshot of the live chat with verification
  await page.screenshot({ path: 'E:/zero/phase4-chat-pinchtab-verified.png', fullPage: true });
  console.log('7. Saved screenshot to E:/zero/phase4-chat-pinchtab-verified.png');

  await browser.close();
  console.log('=== PHASE 4 CHAT VERIFICATION COMPLETED SUCCESSFULLY ===');
}

verifyPhase4PinchTab().catch(err => {
  console.error('Phase 4 verification error:', err);
  process.exit(1);
});
