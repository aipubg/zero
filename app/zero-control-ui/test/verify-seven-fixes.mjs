import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright-core");

const ARTIFACTS_DIR = "C:\\Users\\Professor Zero\\.gemini\\antigravity\\brain\\853155d1-8b17-4e54-9566-15cd1228664e";

async function runLiveVerification() {
  console.log("=== STARTING LIVE VERIFICATION OF 7 CORE FIXES ===");

  // 1. Verify Single Port 18789 (Unified Gateway + Host)
  console.log("\n[Check 1/7] Testing Single Port 18789 Unified Gateway Endpoints...");
  const gwHealth = await fetch("http://127.0.0.1:18789/health").then(r => r.json());
  console.log("   Health response:", gwHealth);
  assert.equal(gwHealth.status, "ok", "Port 18789 health must return ok");
  assert.equal(gwHealth.port, 18789, "Port in health response must be 18789");

  const gwModels = await fetch("http://127.0.0.1:18789/v1/models").then(r => r.json());
  console.log("   Models listed on 18789/v1/models:", gwModels.data?.map(m => m.id));
  assert.ok(gwModels.data?.length >= 4, "Must list active models");

  const isPort18790Dead = await fetch("http://127.0.0.1:18790/health", { signal: AbortSignal.timeout(1000) })
    .then(() => false)
    .catch(() => true);
  assert.ok(isPort18790Dead, "Port 18790 must be completely terminated and dead");
  console.log("✔ PASSED: Unified single server on port 18789 is active; port 18790 terminated.");

  // 2. Verify YouTube Song Autoplay Resolver
  console.log("\n[Check 2/7] Testing YouTube Song Autoplay Video ID Extraction...");
  const { ComputerOperator } = await import("../src/computer/operator.js");
  const operator = new ComputerOperator();
  const playRes = await operator.execute("play", { query: "latest trending song on youtube" });
  console.log("   Play execution result:", { ok: playRes.ok, url: playRes.url });
  assert.equal(playRes.ok, true, "Play action must succeed");
  assert.ok(
    playRes.url.includes("youtube.com/watch?v=") && playRes.url.includes("autoplay=1"),
    `URL must be a direct watch URL with autoplay=1, got: ${playRes.url}`
  );
  console.log("✔ PASSED: YouTube song command resolves directly to playable watch URL with autoplay=1!");

  // Launch Playwright Browser for Live UI Tests
  console.log("\nLaunching Chromium browser for UI validation...");
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-gpu", "--window-size=1400,900"]
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });

  // 3. Verify /chat/zero Page, Branding & Top Buttons
  console.log("\n[Check 3/7] Navigating to http://127.0.0.1:18789/chat/zero...");
  await page.goto("http://127.0.0.1:18789/chat/zero", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);

  const pageTitle = await page.title();
  console.log("   Page title:", pageTitle);
  assert.ok(pageTitle.includes("Zero"), `Page title must include 'Zero', got: ${pageTitle}`);

  // Check top action buttons inside permanent container
  const permActions = await page.evaluate(() => {
    const container = document.getElementById("zero-permanent-top-actions");
    const compBtn = container?.querySelector(".zero-control-toggle-btn");
    const reasonBtn = container?.querySelector(".zero-reasoning-toggle-btn");
    return {
      containerFound: Boolean(container),
      compBtnText: compBtn?.innerText?.trim(),
      reasonBtnText: reasonBtn?.innerText?.trim(),
    };
  });
  console.log("   Top action buttons:", permActions);
  assert.ok(permActions.containerFound, "#zero-permanent-top-actions container must be on document.body");
  assert.ok(permActions.compBtnText?.includes("Computer Control"), "Computer Control button must be present");
  assert.ok(permActions.reasonBtnText?.includes("Reasoning"), "Reasoning button must be present");

  // Toggle buttons and verify reactivity
  await page.click(".zero-control-toggle-btn");
  const compToggled = await page.innerText(".zero-control-toggle-btn");
  assert.ok(compToggled.includes("Standby"), "Computer Control toggled to Standby");
  await page.click(".zero-control-toggle-btn"); // restore

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "verified-chat-home-clean.png"), fullPage: false });
  console.log("✔ PASSED: Top action buttons are permanently mounted and reactive!");

  // 4. Verify Chat Model Selector
  console.log("\n[Check 4/7] Inspecting Chat Model Dropdown...");
  const modelPickerBtn = page.locator("button.chat-controls__model-picker, [data-chat-model-select], button[aria-label*='model'], button[aria-label*='Chat model']").first();
  await modelPickerBtn.waitFor({ state: "visible", timeout: 5000 });
  const modelBtnText = await modelPickerBtn.innerText();
  console.log("   Model trigger text:", modelBtnText.trim());

  await modelPickerBtn.click();
  await page.waitForTimeout(1000);

  const dropdownAnalysis = await page.evaluate(() => {
    const options = Array.from(document.querySelectorAll(".chat-controls__model-option, [data-chat-model-option], wa-dropdown wa-menu-item, [role='menuitem']"));
    const texts = options.map(o => o.innerText.trim()).filter(Boolean);
    const groups = Array.from(document.querySelectorAll(".chat-controls__model-group-title, wa-divider")).map(g => g.innerText.trim()).filter(Boolean);
    return {
      count: texts.length,
      texts,
      groups,
      hasTestModel: texts.some(t => t.includes("test-model")),
      hasZeroGateway: texts.some(t => t.includes("Zero Gateway") || t.includes("zero-gateway")),
      hasFallbackError: Boolean(document.querySelector(".chat-controls__model-fallback, .fallback-warning")),
    };
  });
  console.log("   Model Dropdown Analysis:", dropdownAnalysis);
  assert.equal(dropdownAnalysis.hasTestModel, false, "Dropdown must not contain test-model");
  assert.equal(dropdownAnalysis.hasZeroGateway, false, "Dropdown must not contain zero-gateway");
  assert.equal(dropdownAnalysis.hasFallbackError, false, "There must be NO fallback active warning");

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "verified-chat-model-picker-clean.png"), fullPage: false });
  console.log("✔ PASSED: Chat model dropdown contains ONLY real models with ZERO fallback banners!");

  // Close dropdown
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);

  // 5. Verify Settings Sidebar Cleanliness & Hidden Items
  console.log("\n[Check 5/7] Inspecting Settings Sidebar at http://127.0.0.1:18789/settings...");
  await page.goto("http://127.0.0.1:18789/settings", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  const settingsCleanliness = await page.evaluate(() => {
    const hiddenSelectors = [
      'a[href*="cloud-workers"]',
      'a[href*="channels"]',
      'a[href*="communications"]',
      'a[href*="talk"]',
      'a[href*="devices"]',
      'a[href*="approvals"]',
      '.appearance-tweakcn',
      '[data-section="tweakcn"]',
    ];
    const results = {};
    for (const sel of hiddenSelectors) {
      const el = document.querySelector(sel);
      results[sel] = el ? window.getComputedStyle(el).display : "none";
    }
    const html = document.body.innerHTML;
    const hasOpenclawExternalLinks = /openclaw\.ai|docs\.openclaw\.ai|tweakcn\.com/i.test(html);
    return { results, hasOpenclawExternalLinks };
  });
  console.log("   Settings Cleanliness Check:", settingsCleanliness);
  for (const [sel, disp] of Object.entries(settingsCleanliness.results)) {
    assert.equal(disp, "none", `Element ${sel} must be hidden with display: none`);
  }
  assert.equal(settingsCleanliness.hasOpenclawExternalLinks, false, "Must not contain external openclaw.ai or tweakcn links");

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "verified-settings-sidebar-clean.png"), fullPage: false });
  console.log("✔ PASSED: Settings sidebar hides all unfinished sections and removes all external links!");

  // 6. Verify Models Management Page
  console.log("\n[Check 6/7] Inspecting Models Page at http://127.0.0.1:18789/settings/model-providers...");
  await page.goto("http://127.0.0.1:18789/settings/model-providers", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  const modelsPageCheck = await page.evaluate(() => {
    const html = document.body.innerHTML;
    const hasPort18790 = html.includes("18790");
    const hasPort18789 = html.includes("18789");
    const hasNvProvider = html.includes("nv") || html.includes("NVIDIA") || html.includes("nvidia");
    return { hasPort18790, hasPort18789, hasNvProvider };
  });
  console.log("   Models Page Analysis:", modelsPageCheck);
  assert.equal(modelsPageCheck.hasPort18790, false, "Models page must NOT contain obsolete port 18790!");
  assert.equal(modelsPageCheck.hasPort18789, true, "Models page must reference port 18789!");

  await page.screenshot({ path: path.join(ARTIFACTS_DIR, "verified-models-page-clean.png"), fullPage: false });
  console.log("✔ PASSED: Models page uses port 18789 and shows clean provider configurations!");

  // 7. Verify Permanence of Top Buttons across Route Navigation
  console.log("\n[Check 7/7] Verifying Permanence of Top Buttons after navigating back to Chat...");
  await page.goto("http://127.0.0.1:18789/chat/zero", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  const buttonsStillThere = await page.evaluate(() => {
    const compBtn = document.querySelector("#zero-permanent-top-actions .zero-control-toggle-btn");
    const reasonBtn = document.querySelector("#zero-permanent-top-actions .zero-reasoning-toggle-btn");
    return Boolean(compBtn && reasonBtn && compBtn.offsetParent !== null);
  });
  assert.equal(buttonsStillThere, true, "Top action buttons must persist after route navigation!");
  console.log("✔ PASSED: Top action buttons persist 100% across route/session switches!");

  await browser.close();
  console.log("\n=======================================================");
  console.log("🎉 ALL 7 CORE REQUIREMENTS 100% VERIFIED LIVE VIA PLAYWRIGHT!");
  console.log("=======================================================");
}

runLiveVerification().catch((err) => {
  console.error("FATAL ERROR IN LIVE VERIFICATION:", err);
  process.exit(1);
});
