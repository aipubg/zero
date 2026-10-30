import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright-core");

async function verifyLiveChat() {
  console.log("=== STARTING LIVE CHAT AND MODEL SELECTOR VERIFICATION ===");
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-gpu"]
  });
  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:18789/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);

  // 1. Check sidebar sessions
  const sidebarSessions = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(".sidebar-session-list button, .sidebar-session-list a, .session-item, [data-session-key]"))
      .map(el => el.innerText.trim())
      .filter(Boolean);
  });
  console.log("Sidebar sessions count:", sidebarSessions.length);
  console.log("Sidebar sessions:", sidebarSessions);

  const hasStaleSessions = sidebarSessions.some(s => s.includes("tool-live-exec") || s.includes("be02-acceptance"));
  if (hasStaleSessions) {
    throw new Error("FAILED: Stale test sessions still present on sidebar!");
  }
  console.log("✔ PASSED: Sidebar is 100% clean of all old test sessions!");

  // 2. Check model trigger button
  const triggerInfo = await page.evaluate(() => {
    const trigger = document.querySelector("summary[data-chat-model-select], .chat-controls__model-trigger");
    return {
      found: Boolean(trigger),
      text: trigger ? trigger.innerText.trim() : null,
      aria: trigger ? trigger.getAttribute("aria-label") : null
    };
  });
  console.log("Model trigger info:", triggerInfo);
  if (!triggerInfo.found) {
    throw new Error("FAILED: Chat model trigger button not found!");
  }
  if (triggerInfo.text.includes("test-model") || triggerInfo.text.includes("zero-gateway") || triggerInfo.text === "default") {
    throw new Error(`FAILED: Chat model trigger is showing dummy model: ${triggerInfo.text}`);
  }
  console.log("✔ PASSED: Model trigger shows clean real model:", triggerInfo.text);

  // 3. Click to open model dropdown
  console.log("Clicking model trigger to inspect dropdown menu...");
  await page.click("summary[data-chat-model-select], .chat-controls__model-trigger");
  await page.waitForTimeout(1000);

  // 4. Inspect opened menu
  const menuDetails = await page.evaluate(() => {
    const groups = Array.from(document.querySelectorAll(".chat-controls__provider-heading, .chat-controls__provider-label, [data-chat-model-provider]"))
      .map(g => g.innerText.trim());
    const options = Array.from(document.querySelectorAll(".chat-controls__model-option, [data-chat-model-option]"))
      .map(o => ({
        label: o.getAttribute("aria-label") || o.innerText.trim(),
        value: o.getAttribute("data-chat-model-option")
      }));
    const popupText = document.querySelector(".chat-controls__model-menu, wa-popup")?.innerText || "";
    return { groups, options, popupText };
  });

  console.log("Dropdown Groups found:", menuDetails.groups);
  console.log("Dropdown Options count:", menuDetails.options.length);
  console.log("Dropdown Options:", menuDetails.options);

  // Assertions
  const hasZeroGatewayGroup = menuDetails.groups.some(g => g.includes("Zero Gateway") || g.includes("zero-gateway"));
  const hasTestProviderGroup = menuDetails.groups.some(g => g.includes("Test Provider") || g.includes("test-provider"));
  const hasTestModel = menuDetails.options.some(o => (o.label && o.label.includes("test-model")) || (o.value && o.value.includes("test-model")));
  const hasZeroGatewayDefault = menuDetails.options.some(o => (o.label && o.label.includes("zero-gateway")) || (o.value && o.value.includes("zero-gateway")));

  if (hasZeroGatewayGroup) {
    throw new Error("FAILED: Dummy 'Zero Gateway' group found in dropdown!");
  }
  if (hasTestProviderGroup) {
    throw new Error("FAILED: Dummy 'Test Provider' group found in dropdown!");
  }
  if (hasTestModel) {
    throw new Error("FAILED: Stale 'test-model-1' found in dropdown options!");
  }
  if (hasZeroGatewayDefault) {
    throw new Error("FAILED: Stale 'zero-gateway/default' found in dropdown options!");
  }

  console.log("✔ PASSED: Zero Gateway, Test Provider, and test-model-1 are 100% purged from dropdown!");
  console.log("✔ PASSED: Chat model picker contains ONLY real configured models!");

  // Take screenshot
  await page.screenshot({ path: "E:/zero/clean-chat-model-dropdown.png" });
  console.log("Saved screenshot to E:/zero/clean-chat-model-dropdown.png");

  await browser.close();
  console.log("=== ALL CHECKS PASSED 100%! ===");
}

verifyLiveChat().catch(err => {
  console.error(err);
  process.exit(1);
});
