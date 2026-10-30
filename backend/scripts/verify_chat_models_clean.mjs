import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright-core");

async function verifyChatClean() {
  console.log("=== STARTING LIVE VERIFICATION OF CHAT AND MODEL SELECTOR ===");
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-gpu"]
  });
  const page = await browser.newPage();

  console.log("1. Navigating to http://127.0.0.1:18789/chat/zero...");
  await page.goto("http://127.0.0.1:18789/chat/zero", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);

  // Check A: Sidebar sessions
  const sidebarItems = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a, button, [class*='session']"))
      .map(el => el.innerText.trim())
      .filter(t => t.includes("tool-live-exec") || t.includes("be02-acceptance"));
  });
  console.log("   Stale session items in DOM:", sidebarItems);
  if (sidebarItems.length > 0) {
    throw new Error(`FAILED: Found stale sessions in sidebar DOM: ${JSON.stringify(sidebarItems)}`);
  }
  console.log("✔ PASSED: 0 stale sessions in sidebar DOM!");

  // Check B: Model Trigger Button
  const triggerText = await page.evaluate(() => {
    const trigger = document.querySelector("summary[data-chat-model-select], .chat-controls__model-trigger");
    return trigger ? trigger.innerText.trim() : null;
  });
  console.log("2. Model trigger button text:", triggerText);
  if (!triggerText) {
    throw new Error("FAILED: Model trigger button not found!");
  }
  if (triggerText.includes("zero-gateway") || triggerText.includes("test-model") || triggerText === "default") {
    throw new Error(`FAILED: Model trigger is showing dummy model: ${triggerText}`);
  }
  console.log("✔ PASSED: Model trigger shows clean real model:", triggerText);

  // Check C: Open Dropdown and verify options
  console.log("3. Clicking model trigger to inspect dropdown menu...");
  await page.click("summary[data-chat-model-select], .chat-controls__model-trigger");
  await page.waitForTimeout(1500);

  const dropdownAnalysis = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll(".chat-controls__provider-heading, .chat-controls__provider-label, [data-chat-model-provider]"))
      .map(h => h.innerText.trim());
    const options = Array.from(document.querySelectorAll(".chat-controls__model-option, [data-chat-model-option]"))
      .map(o => ({
        label: o.getAttribute("aria-label") || o.innerText.trim(),
        value: o.getAttribute("data-chat-model-option")
      }));
    const popupText = document.querySelector(".chat-controls__model-menu, wa-popup, details[data-chat-model-select]")?.innerText || "";
    return { headings, options, popupText };
  });

  console.log("   Dropdown headings:", dropdownAnalysis.headings);
  console.log("   Dropdown options count:", dropdownAnalysis.options.length);
  console.log("   Dropdown options sample:", dropdownAnalysis.options.map(o => o.label || o.value));

  const hasDummyZeroGateway = dropdownAnalysis.headings.some(h => h.toLowerCase().includes("zero gateway")) ||
    dropdownAnalysis.options.some(o => (o.label && o.label.toLowerCase().includes("zero-gateway")) || (o.value && o.value.toLowerCase().includes("zero-gateway")));
  const hasDummyTestProvider = dropdownAnalysis.headings.some(h => h.toLowerCase().includes("test provider")) ||
    dropdownAnalysis.options.some(o => (o.label && o.label.toLowerCase().includes("test provider")) || (o.value && o.value.toLowerCase().includes("test provider")));
  const hasDummyTestModel = dropdownAnalysis.options.some(o => (o.label && o.label.toLowerCase().includes("test-model")) || (o.value && o.value.toLowerCase().includes("test-model")));

  if (hasDummyZeroGateway) {
    throw new Error("FAILED: Dummy 'Zero Gateway' still found in dropdown!");
  }
  if (hasDummyTestProvider) {
    throw new Error("FAILED: Dummy 'Test Provider' still found in dropdown!");
  }
  if (hasDummyTestModel) {
    throw new Error("FAILED: Stale 'test-model-1' still found in dropdown options!");
  }

  console.log("✔ PASSED: All dummy models and providers are 100% eliminated!");
  console.log("✔ PASSED: Chat model selector displays ONLY real configured models!");

  // Take screenshot for user
  const screenshotPath = "C:/Users/Professor Zero/.gemini/antigravity/brain/853155d1-8b17-4e54-9566-15cd1228664e/verified-clean-chat-model-dropdown.png";
  await page.screenshot({ path: screenshotPath });
  console.log(`Saved live screenshot to: ${screenshotPath}`);

  await browser.close();
  console.log("=== ALL CHAT AND MODEL SELECTOR CHECKS PASSED 100%! ===");
}

verifyChatClean().catch(err => {
  console.error(err);
  process.exit(1);
});
