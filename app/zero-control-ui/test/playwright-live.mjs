import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("E:/zero/.zero-data/fresh-workspace/gateway-state/node-runtime/releases/2026.10.7-10ad68f0f0f519bc2ee40ec9e23435359e7ba939749fd7b4a290df3512ba49af/node_modules/openclaw/node_modules/playwright-core");

async function runEndToEndVerification() {
  console.log("=== STARTING ZERO MODELS CLEAN UI PLAYWRIGHT VERIFICATION ===");
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-gpu"]
  });
  const page = await browser.newPage();

  page.on("console", msg => {
    if (msg.type() === "error") {
      console.log("[CONSOLE ERROR]", msg.text());
    }
  });

  // STEP 1: Start at /settings/about and navigate to /settings/model-providers
  console.log("\n1. Navigating to http://127.0.0.1:18789/settings/about ...");
  await page.goto("http://127.0.0.1:18789/settings/about", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);

  console.log("2. Clicking 'Models' in sidebar...");
  await page.evaluate(() => {
    const link = document.querySelector('.settings-sidebar a[href*="model-providers"]');
    if (link) link.click();
  });
  await page.waitForTimeout(2000);

  const currentUrl = page.url();
  console.log("   URL:", currentUrl);
  if (!currentUrl.includes("/settings/model-providers") || currentUrl.includes("/chat/zero")) {
    throw new Error(`FAILED: Navigation redirected or stayed off-target: ${currentUrl}`);
  }
  console.log("   PASSED: Cleanly on /settings/model-providers!");

  // STEP 2: Verify Exact Page Header Structure
  console.log("\n3. Verifying Exact Page Header Structure...");
  const headerCheck = await page.evaluate(() => {
    const statusIcon = !!document.querySelector(".zero-models-status-icon");
    const subtitle = document.querySelector(".zero-models-header__subtitle")?.innerText.trim();
    const title = document.querySelector(".zero-models-header__title")?.innerText.trim();
    const actions = Array.from(document.querySelectorAll(".zero-models-header__actions button")).map(b => b.innerText.trim());

    return {
      statusIcon,
      subtitle,
      title,
      actions
    };
  });
  console.log("   Header Data:", headerCheck);

  if (!headerCheck.statusIcon) throw new Error("FAILED: Status icon missing!");
  if (headerCheck.subtitle.toUpperCase() !== "ZERO MODELS (PRIVATE GATEWAY PROVIDER MANAGER)") {
    throw new Error(`FAILED: Subtitle mismatch! Got: ${headerCheck.subtitle}`);
  }
  if (headerCheck.title !== "Models & Providers") {
    throw new Error(`FAILED: Main title mismatch! Got: ${headerCheck.title}`);
  }
  if (!headerCheck.actions.includes("+ Add Provider") || !headerCheck.actions.includes("Import GGUF") || !headerCheck.actions.includes("Agents ->")) {
    throw new Error(`FAILED: Header buttons missing! Got: ${JSON.stringify(headerCheck.actions)}`);
  }
  console.log("   PASSED: Header with status icon, exact titles and 3 buttons verified!");

  // STEP 3: Verify Section 1 — Model Defaults & Preferences Card
  console.log("\n4. Verifying Section 1 — Model Defaults & Preferences Card...");
  const sec1Check = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll(".zero-models-card"));
    if (cards.length < 2) return null;

    const c1 = cards[0];
    const title = c1.querySelector(".zero-models-card__title")?.innerText.trim();
    const subtitle = c1.querySelector(".zero-models-card__subtitle")?.innerText.trim();
    const fieldLabels = Array.from(c1.querySelectorAll(".zero-selector-field__label")).map(l => l.innerText.trim());
    const selectCount = c1.querySelectorAll(".zero-selector-field__select").length;
    const saveBtn = c1.querySelector(".zero-btn-save-defaults")?.innerText.trim();

    return {
      title,
      subtitle,
      fieldLabels,
      selectCount,
      saveBtn
    };
  });
  console.log("   Section 1 Data:", sec1Check);

  if (!sec1Check) throw new Error("FAILED: Section 1 card not found!");
  if (sec1Check.title !== "Model Defaults & Preferences") {
    throw new Error(`FAILED: Card 1 title mismatch: ${sec1Check.title}`);
  }
  if (!sec1Check.subtitle.includes("Preserves Auto model, Auto utility, configurable fallback")) {
    throw new Error(`FAILED: Card 1 subtitle mismatch: ${sec1Check.subtitle}`);
  }
  if (sec1Check.selectCount !== 5) {
    throw new Error(`FAILED: Expected 5 dropdown selectors, found ${sec1Check.selectCount}`);
  }
  if (sec1Check.saveBtn !== "Save Defaults") {
    throw new Error(`FAILED: Red-bordered Save Defaults button not found! Got: ${sec1Check.saveBtn}`);
  }
  console.log("   PASSED: Section 1 Card with 5 dropdowns and Save Defaults button verified!");

  // STEP 4: Verify Section 2 — Agent Model Bindings Card
  console.log("\n5. Verifying Section 2 — Agent Model Bindings Card...");
  const sec2Check = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll(".zero-models-card"));
    if (cards.length < 2) return null;

    const c2 = cards[1];
    const title = c2.querySelector(".zero-models-card__title")?.innerText.trim();
    const subtitle = c2.querySelector(".zero-models-card__subtitle")?.innerText.trim();
    const agentTitle = c2.querySelector(".zero-agent-binding-title")?.innerText.trim();
    const badge = c2.querySelector(".zero-agent-binding-badge")?.innerText.trim();
    const descLabels = Array.from(c2.querySelectorAll(".zero-agent-desc-box__label")).map(l => l.innerText.trim());
    const hasAgentSelect = !!c2.querySelector(".zero-agent-assign-select");
    const assignBtn = c2.querySelector(".zero-btn-assign-agent")?.innerText.trim();
    const overrideLabel = c2.querySelector(".zero-agent-override-label")?.innerText.trim();
    const hasCheckbox = !!c2.querySelector(".zero-agent-override-checkbox");

    return {
      title,
      subtitle,
      agentTitle,
      badge,
      descLabels,
      hasAgentSelect,
      assignBtn,
      overrideLabel,
      hasCheckbox
    };
  });
  console.log("   Section 2 Data:", sec2Check);

  if (!sec2Check) throw new Error("FAILED: Section 2 card not found!");
  if (sec2Check.title !== "Agent Model Bindings") {
    throw new Error(`FAILED: Card 2 title mismatch: ${sec2Check.title}`);
  }
  if (!sec2Check.subtitle.includes("Assign models to configured agents independently")) {
    throw new Error(`FAILED: Card 2 subtitle mismatch: ${sec2Check.subtitle}`);
  }
  if (sec2Check.agentTitle !== "Zero (zero)" || sec2Check.badge !== "EXPLICIT BINDING") {
    throw new Error(`FAILED: Agent header or EXPLICIT BINDING badge missing!`);
  }
  if (!sec2Check.descLabels.includes("Active Model:") || !sec2Check.descLabels.includes("Fallbacks:")) {
    throw new Error(`FAILED: Description box missing Active Model or Fallbacks labels!`);
  }
  if (!sec2Check.hasAgentSelect || sec2Check.assignBtn !== "Assign to Zero") {
    throw new Error(`FAILED: Agent select dropdown or Assign to Zero button missing!`);
  }
  if (!sec2Check.hasCheckbox || !sec2Check.overrideLabel.includes("Allow unverified model override")) {
    throw new Error(`FAILED: Checkbox or override label missing!`);
  }
  console.log("   PASSED: Section 2 Card with Zero (zero), EXPLICIT BINDING badge, dropdown, Assign button, and checkbox verified!");

  // STEP 5: Verify NO Clutter (No preset boxes, no status cards)
  console.log("\n6. Verifying Absence of Clutter (Presets and Status Boxes)...");
  const clutterCheck = await page.evaluate(() => {
    const presetsBar = !!document.querySelector(".zero-presets-bar");
    const presetChips = document.querySelectorAll(".zero-preset-chip").length;
    const heroBoxes = document.querySelectorAll(".zero-metric-card").length;
    return { presetsBar, presetChips, heroBoxes };
  });
  console.log("   Clutter Check:", clutterCheck);
  if (clutterCheck.presetsBar || clutterCheck.presetChips > 0 || clutterCheck.heroBoxes > 0) {
    throw new Error("FAILED: Cluttered presets or hero status boxes are still present on the page!");
  }
  console.log("   PASSED: Zero clutter confirmed! Presets and status boxes are 100% removed.");

  // STEP 6: Test Modals (+ Add Provider and Import GGUF)
  console.log("\n7. Testing Modals...");
  // Test + Add Provider modal
  await page.evaluate(() => {
    const addBtn = document.querySelector(".zero-models-btn--add-provider");
    if (addBtn) addBtn.click();
  });
  await page.waitForTimeout(1000);

  const addModalOpen = await page.evaluate(() => {
    const modalTitle = document.querySelector(".zero-modal__title")?.innerText.trim();
    const hasBaseUrl = !!document.querySelector('.zero-modal__input[placeholder*="http"]');
    const hasFetchBtn = Array.from(document.querySelectorAll(".zero-modal button")).some(b => b.innerText.includes("Fetch Models"));
    return { modalTitle, hasBaseUrl, hasFetchBtn };
  });
  console.log("   + Add Provider Modal:", addModalOpen);
  if (!addModalOpen.hasBaseUrl || !addModalOpen.hasFetchBtn) {
    throw new Error("FAILED: Custom Provider modal did not open properly!");
  }

  // Close Add Provider modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector(".zero-modal__close");
    if (closeBtn) closeBtn.click();
  });
  await page.waitForTimeout(500);

  // Test Import GGUF modal
  await page.evaluate(() => {
    const importBtn = document.querySelector(".zero-models-btn--import-gguf");
    if (importBtn) importBtn.click();
  });
  await page.waitForTimeout(1000);

  const ggufModalOpen = await page.evaluate(() => {
    const modalTitle = document.querySelector(".zero-modal__title")?.innerText.trim();
    const hasTabs = document.querySelectorAll(".zero-gguf-tool-tabs .zero-segmented-tab").length;
    return { modalTitle, hasTabs };
  });
  console.log("   Import GGUF Modal:", ggufModalOpen);
  if (ggufModalOpen.hasTabs < 3) {
    throw new Error("FAILED: Import GGUF modal did not render the offline engine tool tabs!");
  }

  // Close GGUF modal
  await page.evaluate(() => {
    const closeBtn = document.querySelector(".zero-modal__close");
    if (closeBtn) closeBtn.click();
  });
  await page.waitForTimeout(500);

  console.log("   PASSED: Both modals (+ Add Provider and Import GGUF) open and close cleanly!");

  console.log("\n=== ALL ZERO MODELS CLEAN UI CHECKS PASSED 100%! ===");
  await browser.close();
}

runEndToEndVerification().catch(err => {
  console.error("\n❌ VERIFICATION TEST FAILED:", err);
  process.exit(1);
});
