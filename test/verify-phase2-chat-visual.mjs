import { chromium } from '../backend/node_modules/.pnpm/playwright-core@1.63.0/node_modules/playwright-core/index.mjs';

async function verifyPhase2ChatVisualPerception() {
  console.log('=== STARTING PHASE 2 CHAT SECTION VISUAL TEST ===');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage();
  
  await page.goto('http://127.0.0.1:18789/chat/zero', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  console.log('1. Page loaded. Title:', await page.title());

  // Verify the Screen Share Live button is present in the UI
  const screenBtn = await page.$('.zero-screen-share-toggle-btn');
  console.log('2. Screen Share Toggle Button found in UI:', Boolean(screenBtn));
  if (!screenBtn) {
    throw new Error('Screen Share toggle button not found in UI!');
  }

  // Click Screen Share toggle button to open the live preview modal
  console.log('3. Clicking Screen Share Toggle Button to open live feed modal...');
  await screenBtn.click();
  await page.waitForTimeout(2000);

  const previewModal = await page.$('.zero-screen-preview-modal');
  console.log('4. Live Screen Share Preview Modal visible in UI:', Boolean(previewModal));
  if (!previewModal) {
    throw new Error('Live Screen Share preview modal failed to mount!');
  }

  // Find composer in Chat Section
  const composer = await page.waitForSelector('textarea[placeholder*="Message Zero"]', { timeout: 10000 });
  console.log('5. Found Chat Composer.');

  // Ask visual question: "Mere screen par abhi kya dikh raha hai? Kaun-kaun se buttons aur windows open hain?"
  const visualPrompt = 'Mere screen par abhi kya dikh raha hai? Kaun-kaun se buttons aur windows open hain?';
  console.log('6. Typing prompt into Chat Section:', visualPrompt);
  await composer.fill(visualPrompt);
  await page.keyboard.press('Enter');

  // Wait for real-time visual inspection & response
  console.log('7. Waiting for agent to inspect screen and stream answer...');
  await page.waitForTimeout(6000);

  // Extract recent response
  const recentText = await page.evaluate(() => {
    const bubbles = Array.from(document.querySelectorAll('.chat-bubble, .message-bubble, .chat-text, [data-message-role]'));
    return bubbles.map(b => b.innerText.trim()).filter(Boolean);
  });

  const lastResponse = recentText[recentText.length - 1] || '';
  console.log('8. Agent Response in Chat Section:\n----------------------------------------\n' + lastResponse + '\n----------------------------------------');

  const containsLivePerception = lastResponse.includes('Live Visual Screen Perception') || lastResponse.includes('Active Window');
  console.log('9. Verified Live Visual Perception Response:', containsLivePerception ? 'PASSED ✅' : 'FAILED ❌');
  if (!containsLivePerception) {
    throw new Error('Response did not contain expected live visual screen perception output!');
  }

  // Take screenshot of the live chat with screen preview
  await page.screenshot({ path: 'E:/zero/phase2-chat-visual-verified.png', fullPage: true });
  console.log('10. Saved screenshot to E:/zero/phase2-chat-visual-verified.png');

  await browser.close();
  console.log('=== PHASE 2 CHAT VERIFICATION COMPLETED SUCCESSFULLY ===');
}

verifyPhase2ChatVisualPerception().catch(err => {
  console.error('Phase 2 verification error:', err);
  process.exit(1);
});
