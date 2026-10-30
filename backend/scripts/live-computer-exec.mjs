import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright-core");

async function runLiveComputerExecution() {
  console.log("=== STARTING LIVE END-TO-END COMPUTER EXECUTION IN /chat/zero ===");
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-gpu"]
  });
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:18789/chat/zero", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);

  // 1. Verify model trigger button
  const modelText = await page.evaluate(() => {
    const trigger = document.querySelector("summary[data-chat-model-select], .chat-controls__model-trigger");
    return trigger ? trigger.innerText.trim() : null;
  });
  console.log("Active Chat Model on UI:", modelText);

  // 2. Target the main composer textarea
  const inputSelector = 'textarea[placeholder="Message Zero"], textarea:not(.session-menu__icon-custom-input)';
  await page.waitForSelector(inputSelector, { timeout: 10000 });
  
  const testPrompt = "Zero, mere computer ki screen aur active windows check karke batao ki abhi kya-kya khula hai, aur system report do.";
  console.log("\nSending prompt to Zero:\n", testPrompt);

  await page.fill(inputSelector, testPrompt);
  await page.waitForTimeout(500);

  // Press Enter to submit
  console.log("Pressing Enter to send prompt...");
  await page.press(inputSelector, "Enter");

  // 3. Wait for Zero's response to appear and complete
  console.log("Waiting for Zero's response...");
  let replyText = "";

  for (let i = 0; i < 35; i++) {
    await page.waitForTimeout(2000);
    const state = await page.evaluate(() => {
      const bubbles = Array.from(document.querySelectorAll(".chat-text, .chat-view pre, [data-bubble='agent'], .chat-message, .chat-bubble--agent"))
        .map(el => el.innerText.trim())
        .filter(Boolean);
      const isSending = Boolean(document.querySelector(".chat-send-btn--busy, [data-chat-state='busy'], .chat-indicator--running"));
      const last = bubbles[bubbles.length - 1] || "";
      return {
        count: bubbles.length,
        last,
        isSending
      };
    });

    if (state.last && !state.last.includes(testPrompt)) {
      replyText = state.last;
      if (!state.isSending && replyText.length > 20) {
        break;
      }
    }
    process.stdout.write(".");
  }
  console.log("\n");

  console.log("=== ZERO LIVE RESPONSE RECEIVED ===");
  console.log(replyText || "(Response in progress / logged)");
  console.log("===================================");

  const screenshotPath = "C:/Users/Professor Zero/.gemini/antigravity/brain/853155d1-8b17-4e54-9566-15cd1228664e/live-computer-execution-result.png";
  await page.screenshot({ path: screenshotPath });
  console.log(`Saved live conversation screenshot to ${screenshotPath}`);

  await browser.close();
  return { ok: Boolean(replyText), replyText };
}

runLiveComputerExecution().catch(err => {
  console.error("Execution error:", err.message);
  process.exit(1);
});
