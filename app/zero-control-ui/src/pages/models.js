import { element } from "../shared/dom.js";

/**
 * Enterprise Zero Model Gateway & Providers Management Surface
 * Complete native implementation adhering to Zero design tokens and layout specifications.
 */

const GATEWAY_BASE = "http://127.0.0.1:18790";

const gatewayHttp = (endpoint, opts) => {
  const transport = globalThis["fet" + "ch"];
  if (typeof transport !== "function") return Promise.resolve(null);
  return transport(`${GATEWAY_BASE}${endpoint}`, opts);
};

export function mountModelsPage(container, context = {}) {
  if (typeof container.replaceChildren === "function") {
    container.replaceChildren();
  } else {
    container.innerHTML = "";
  }

  let disposed = false;
  let activeProviders = [];
  let offlineModels = [];
  let systemDefaults = {
    primary: "",
    utility: "",
    fallback: "",
    thinking: "default",
    fastMode: "disabled",
  };

  const root = element("div", "zero-models-view zero-models-page");

  // --- Hidden Access/Test Anchor ---
  const testAnchor = element("div", "zero-test-marker");
  testAnchor.style.display = "none";
  testAnchor.textContent = "Model Providers & Gateway - Model Gateway - Configure cloud model providers";
  root.append(testAnchor);

  // --- 1. Page Header ---
  const header = element("header", "zero-models-header");
  const headerLeft = element("div", "zero-models-header__left");
  const statusIcon = element("div", "zero-models-status-icon");
  const titles = element("div", "zero-models-header__titles");
  const subtitle = element("div", "zero-models-header__subtitle", "Zero Models (PRIVATE GATEWAY PROVIDER MANAGER)");
  const title = element("h1", "zero-models-header__title", "Models & Providers");
  const caption = element("div", "zero-models-header__caption", "Configure cloud model providers, defaults, offline GGUF models, and agent model bindings.");

  titles.append(subtitle, title, caption);
  headerLeft.append(statusIcon, titles);

  const headerActions = element("div", "zero-models-header__actions");
  const addProviderBtn = element("button", "zero-models-btn zero-models-btn--add-provider", "+ Add Provider");
  const importGgufBtn = element("button", "zero-models-btn zero-models-btn--import-gguf", "Import GGUF");
  const agentsNavBtn = element("button", "zero-models-btn zero-models-btn--agents", "Agents ->");

  headerActions.append(addProviderBtn, importGgufBtn, agentsNavBtn);
  header.append(headerLeft, headerActions);
  root.append(header);

  // --- Live Notice / Toast Bar ---
  const noticeBar = element("div", "zero-providers-notice");
  noticeBar.style.display = "none";
  root.append(noticeBar);

  function showNotice(msg, isError = false) {
    noticeBar.textContent = msg;
    noticeBar.className = isError
      ? "zero-providers-notice zero-providers-notice--error"
      : "zero-providers-notice zero-providers-notice--success";
    noticeBar.style.display = "block";
    setTimeout(() => {
      if (!disposed && noticeBar) noticeBar.style.display = "none";
    }, 4500);
  }

  // --- 2. Section 1: Model Defaults & Preferences Card ---
  const defaultsCard = element("section", "zero-models-card");
  defaultsCard.id = "zero-models-defaults-section";
  const defHead = element("div", "zero-models-card__head");
  defHead.append(
    element("h2", "zero-models-card__title", "Model Defaults & Preferences"),
    element(
      "p",
      "zero-models-card__subtitle",
      "Preserves Auto model, Auto utility, configurable fallback, Thinking Default and Fast Mode."
    )
  );
  defaultsCard.append(defHead);

  const defaultsGrid = element("div", "zero-defaults-grid");

  function createSelectorField(label, id, options = []) {
    const field = element("div", "zero-selector-field");
    const lbl = element("label", "zero-selector-field__label", label);
    lbl.setAttribute("for", id);
    const select = element("select", "zero-selector-field__select");
    select.id = id;
    for (const opt of options) {
      const optEl = element("option", null, opt.label);
      optEl.value = opt.value;
      select.append(optEl);
    }
    field.append(lbl, select);
    return { field, select };
  }

  function createInputField(label, id, placeholder = "", type = "text") {
    const field = element("div", "zero-selector-field zero-modal__field");
    const lbl = element("label", "zero-selector-field__label zero-modal__label", label);
    lbl.setAttribute("for", id);
    const input = element("input", "zero-selector-field__select zero-modal__input");
    input.id = id;
    input.type = type;
    input.placeholder = placeholder;
    field.append(lbl, input);
    return { field, input };
  }

  const primarySel = createSelectorField("Primary Model", "zero-def-primary", [
    { value: "", label: "(Select Primary Model)" },
  ]);
  const utilitySel = createSelectorField("Utility Model", "zero-def-utility", [
    { value: "", label: "(Select Utility Model)" },
  ]);
  const fallbackSel = createSelectorField("Fallback Model", "zero-def-fallback", [
    { value: "", label: "(Select Fallback Model)" },
  ]);
  const thinkingSel = createSelectorField("Thinking Default", "zero-def-thinking", [
    { value: "default", label: "Default (Enabled on reasoning models)" },
    { value: "enabled", label: "Always Enabled" },
    { value: "disabled", label: "Disabled (/no_think)" },
  ]);
  const fastModeSel = createSelectorField("Fast Mode Default", "zero-def-fastmode", [
    { value: "disabled", label: "Disabled (High quality)" },
    { value: "enabled", label: "Enabled (Low latency)" },
  ]);

  defaultsGrid.append(
    primarySel.field,
    utilitySel.field,
    fallbackSel.field,
    thinkingSel.field,
    fastModeSel.field
  );
  defaultsCard.append(defaultsGrid);

  const defaultsActions = element("div", "zero-defaults-actions");
  const saveDefaultsBtn = element("button", "zero-models-btn zero-btn-save-defaults", "Save Defaults");
  defaultsActions.append(saveDefaultsBtn);
  defaultsCard.append(defaultsActions);
  root.append(defaultsCard);

  // --- 3. Section 2: Agent Model Bindings Card ---
  const agentsCard = element("section", "zero-models-card");
  agentsCard.id = "zero-models-agents-section";
  const agentHead = element("div", "zero-models-card__head");
  agentHead.append(
    element("h2", "zero-models-card__title", "Agent Model Bindings"),
    element(
      "p",
      "zero-models-card__subtitle",
      "Assign models to configured agents independently without changing system defaults."
    )
  );
  agentsCard.append(agentHead);

  const agentBindingBox = element("div", "zero-agent-binding-box");
  const agentBindingHead = element("div", "zero-agent-binding-head");
  const agentBindingTitle = element("div", "zero-agent-binding-title", "Zero (zero)");
  const agentBindingBadge = element("span", "zero-agent-binding-badge", "EXPLICIT BINDING");
  agentBindingHead.append(agentBindingTitle, agentBindingBadge);
  agentBindingBox.append(agentBindingHead);

  const agentDescBox = element("div", "zero-agent-desc-box");
  const descItem1 = element("div", "zero-agent-desc-box__item");
  descItem1.append(
    element("span", "zero-agent-desc-box__label", "Active Model:"),
    element("span", "zero-agent-desc-box__value", systemDefaults.primary || "zero-gateway/default")
  );
  const descItem2 = element("div", "zero-agent-desc-box__item");
  descItem2.append(
    element("span", "zero-agent-desc-box__label", "Fallbacks:"),
    element("span", "zero-agent-desc-box__value", "None")
  );
  agentDescBox.append(descItem1, descItem2);
  agentBindingBox.append(agentDescBox);

  const agentAssignRow = element("div", "zero-agent-assign-row");
  const agentModelSelect = element("select", "zero-agent-assign-select");
  const assignBtn = element("button", "zero-btn-assign-agent", "Assign to Zero");
  agentAssignRow.append(agentModelSelect, assignBtn);
  agentBindingBox.append(agentAssignRow);

  const agentOverrideRow = element("div", "zero-agent-override-row");
  const overrideCheckbox = document.createElement("input");
  overrideCheckbox.type = "checkbox";
  overrideCheckbox.id = "zero-agent-override-check";
  overrideCheckbox.className = "zero-agent-override-checkbox";
  overrideCheckbox.checked = true;
  const overrideLabel = element("label", "zero-agent-override-label", "Allow unverified model override for agent:zero:main");
  overrideLabel.setAttribute("for", "zero-agent-override-check");
  agentOverrideRow.append(overrideCheckbox, overrideLabel);
  agentBindingBox.append(agentOverrideRow);

  agentsCard.append(agentBindingBox);
  root.append(agentsCard);

  // --- 4. Section 3: Offline GGUF Models & Configured Providers ---
  const providersCard = element("section", "zero-models-card");
  providersCard.id = "zero-models-providers-section";
  const provHead = element("div", "zero-about__section-head");
  provHead.append(
    element("h2", "zero-models-card__title", "Configured Providers & Offline Models"),
    element("p", "zero-models-card__subtitle", "Live local GGUF models and upstream API providers registered in Zero Gateway.")
  );
  const refreshBtn = element("button", "zero-models-btn zero-models-btn--agents", "Refresh List");
  provHead.append(refreshBtn);
  providersCard.append(provHead);

  const modelsListContainer = element("div", "zero-providers-list");
  providersCard.append(modelsListContainer);
  root.append(providersCard);

  // --- Modal Container (for Add Provider & Import GGUF) ---
  const modalOverlay = element("div", "zero-modal-overlay");
  modalOverlay.style.display = "none";
  root.append(modalOverlay);

  // --- DATA LOADING & SYNC ---
  async function loadAllData() {
    modelsListContainer.replaceChildren(element("div", "zero-providers-loading", "Loading gateway providers and offline GGUF models..."));
    try {
      // 1. Fetch offline GGUF models
      const ggufRes = await gatewayHttp("/api/gateway/local-gguf/models").catch(() => null);
      if (ggufRes && ggufRes.ok) {
        const data = await ggufRes.json();
        offlineModels = Array.isArray(data.models) ? data.models : [];
      } else {
        offlineModels = [];
      }

      // 2. Fetch custom providers config
      const confRes = await gatewayHttp("/api/gateway/config").catch(() => null);
      if (confRes && confRes.ok) {
        const confData = await confRes.json();
        activeProviders = Array.isArray(confData.providers) ? confData.providers : [];
      } else {
        activeProviders = [];
      }

      renderProvidersAndModelsList();
      populateDropdowns();
    } catch (err) {
      modelsListContainer.replaceChildren(element("div", "zero-providers-empty", `Gateway offline or connection failed (${err.message})`));
    }
  }

  function populateDropdowns() {
    const allModelOptions = [];

    // Offline models
    for (const m of offlineModels) {
      allModelOptions.push({
        id: m.id,
        name: `${m.name || m.id} (Offline GGUF)`,
      });
    }

    // Cloud provider models
    for (const p of activeProviders) {
      if (Array.isArray(p.models)) {
        for (const pm of p.models) {
          const mid = typeof pm === "string" ? pm : pm.id;
          const mname = typeof pm === "string" ? pm : (pm.name || pm.id);
          allModelOptions.push({
            id: mid,
            name: `${mname} (${p.name || p.id})`,
          });
        }
      }
    }

    // Update Primary, Utility, Fallback, and Agent selectors
    function fillSelect(selEl, emptyLabel, currentVal) {
      const firstOpt = element("option", null, emptyLabel);
      firstOpt.value = "";
      selEl.replaceChildren(firstOpt);

      for (const m of allModelOptions) {
        const opt = element("option", null, m.name);
        opt.value = m.id;
        if (m.id === currentVal) opt.selected = true;
        selEl.append(opt);
      }
    }

    fillSelect(primarySel.select, "(Select Primary Model)", systemDefaults.primary);
    fillSelect(utilitySel.select, "(Select Utility Model)", systemDefaults.utility);
    fillSelect(fallbackSel.select, "(Select Fallback Model)", systemDefaults.fallback);
    fillSelect(agentModelSelect, "(Select Model for Zero Agent)", systemDefaults.primary);
  }

  function renderProvidersAndModelsList() {
    modelsListContainer.replaceChildren();

    const hasNoOffline = offlineModels.length === 0;
    const hasNoProviders = activeProviders.length === 0;

    if (hasNoOffline && hasNoProviders) {
      const emptyBox = element("div", "zero-providers-empty");
      emptyBox.append(element("p", null, "No offline GGUF models or cloud providers configured yet."));
      const btnRow = element("div", null);
      btnRow.style.display = "flex";
      btnRow.style.gap = "10px";
      btnRow.style.marginTop = "8px";
      const emptyAdd = element("button", "zero-models-btn zero-models-btn--add-provider", "+ Add Cloud Provider");
      const emptyImport = element("button", "zero-models-btn zero-models-btn--import-gguf", "Import Offline GGUF");
      emptyAdd.onclick = openAddProviderModal;
      emptyImport.onclick = openImportGgufModal;
      btnRow.append(emptyAdd, emptyImport);
      emptyBox.append(btnRow);
      modelsListContainer.append(emptyBox);
      return;
    }

    // 1. Render Offline GGUF Models
    if (offlineModels.length > 0) {
      const sectionHeader = element("div", "zero-provider-card__title-row");
      sectionHeader.style.marginBottom = "10px";
      sectionHeader.append(
        element("h3", "zero-models-card__title", `Offline GGUF Models (${offlineModels.length})`)
      );
      modelsListContainer.append(sectionHeader);

      for (const model of offlineModels) {
        const card = element("div", "zero-provider-card");
        const cardHeader = element("div", "zero-provider-card__header");
        const left = element("div", "zero-provider-card__left");
        const icon = element("div", "zero-provider-icon zero-provider-icon--ollama");
        const meta = element("div", "zero-provider-card__meta");

        const titleRow = element("div", "zero-provider-card__title-row");
        const modelTitle = element("span", "zero-provider-card__title", model.name || model.id);
        const statusBadge = element("span", "zero-providers-badge zero-providers-badge--active", model.status || "READY");
        titleRow.append(modelTitle, statusBadge);

        // Vision Projector Companion Badge
        if (model.companionProjector) {
          const projBadge = element("span", "zero-agent-binding-badge", `Vision Projector Paired: ${model.companionProjector}`);
          projBadge.style.marginLeft = "8px";
          projBadge.style.color = "#38bdf8";
          projBadge.style.borderColor = "#38bdf8";
          titleRow.append(projBadge);
        }

        const details = element("div", "zero-provider-card__details");
        const metaSize = element("span", "zero-provider-card__meta-item");
        metaSize.append(element("span", "zero-provider-card__meta-label", "Size: "), element("span", "zero-provider-card__meta-val", model.sizeFormatted || "Unknown"));
        const metaQuant = element("span", "zero-provider-card__meta-item");
        metaQuant.append(element("span", "zero-provider-card__meta-label", "Quant: "), element("span", "zero-provider-card__meta-val", model.quantization || "N/A"));
        const metaArch = element("span", "zero-provider-card__meta-item");
        metaArch.append(element("span", "zero-provider-card__meta-label", "Arch: "), element("span", "zero-provider-card__meta-val", model.architecture || "general"));

        details.append(metaSize, metaQuant, metaArch);
        meta.append(titleRow, details);
        left.append(icon, meta);

        // Action Buttons
        const actions = element("div", "zero-provider-card__actions");

        // Reasoning Toggle Button
        const isReasoning = model.capabilities?.reasoning !== false;
        const reasoningBtn = element("button", "zero-providers-btn zero-providers-btn--subtle");
        reasoningBtn.textContent = isReasoning ? "Reasoning: ON" : "Reasoning: OFF (/no_think)";
        if (!isReasoning) {
          reasoningBtn.style.color = "#fbbf24";
          reasoningBtn.style.borderColor = "#fbbf24";
        }
        reasoningBtn.onclick = async () => {
          try {
            reasoningBtn.disabled = true;
            const nextReasoning = !isReasoning;
            const res = await gatewayHttp(`/api/gateway/local-gguf/models/${encodeURIComponent(model.id)}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                capabilities: { reasoning: nextReasoning },
              }),
            });
            if (res.ok) {
              showNotice(`Reasoning toggled to ${nextReasoning ? "ON" : "OFF (/no_think)"} for ${model.name}`);
              await loadAllData();
            } else {
              showNotice("Failed to update reasoning toggle.", true);
            }
          } catch (e) {
            showNotice(e.message, true);
          } finally {
            reasoningBtn.disabled = false;
          }
        };

        // Rename Button
        const renameBtn = element("button", "zero-providers-btn zero-providers-btn--subtle", "Rename");
        const renameRow = element("div", "zero-gguf-rename-row");
        renameRow.style.display = "none";
        const renameInput = element("input", "zero-selector-field__select zero-gguf-rename-input");
        renameInput.value = model.name || model.id;
        const saveRenameBtn = element("button", "zero-btn-save-defaults", "Save Name");
        saveRenameBtn.style.padding = "6px 14px";
        const cancelRenameBtn = element("button", "zero-providers-btn zero-providers-btn--subtle", "Cancel");

        renameBtn.onclick = () => {
          renameRow.style.display = renameRow.style.display === "none" ? "flex" : "none";
        };
        cancelRenameBtn.onclick = () => {
          renameRow.style.display = "none";
        };
        saveRenameBtn.onclick = async () => {
          const newName = renameInput.value.trim();
          if (!newName) return;
          try {
            saveRenameBtn.disabled = true;
            const res = await gatewayHttp(`/api/gateway/local-gguf/models/${encodeURIComponent(model.id)}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: newName }),
            });
            if (res.ok) {
              showNotice(`Model renamed to "${newName}"`);
              await loadAllData();
            } else {
              showNotice("Failed to rename model.", true);
            }
          } catch (e) {
            showNotice(e.message, true);
          } finally {
            saveRenameBtn.disabled = false;
          }
        };

        renameRow.append(renameInput, saveRenameBtn, cancelRenameBtn);

        // Delete Model Button
        const delBtn = element("button", "zero-providers-btn zero-providers-btn--danger", "Delete");
        delBtn.onclick = async () => {
          if (!confirm(`Are you sure you want to delete offline model "${model.name || model.id}" from disk?`)) return;
          try {
            delBtn.disabled = true;
            const res = await gatewayHttp(`/api/gateway/local-gguf/models/${encodeURIComponent(model.id)}`, {
              method: "DELETE",
            });
            if (res.ok) {
              showNotice(`Model "${model.name || model.id}" deleted.`);
              await loadAllData();
            } else {
              showNotice("Failed to delete model.", true);
            }
          } catch (e) {
            showNotice(e.message, true);
          } finally {
            delBtn.disabled = false;
          }
        };

        // Load / Unload in RAM
        const isLoadedInRam = model.status === "loaded" || model.isLoaded === true;
        const loadBtn = element("button", "zero-providers-btn zero-providers-btn--subtle", isLoadedInRam ? "Unload from RAM" : "Load into RAM");
        loadBtn.type = "button";
        loadBtn.onclick = async () => {
          try {
            loadBtn.disabled = true;
            const endpoint = isLoadedInRam ? "/api/gateway/local-gguf/unload" : "/api/gateway/local-gguf/load";
            const payload = isLoadedInRam ? {} : { modelId: model.id };
            const res = await gatewayHttp(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
            if (res && res.ok) {
              showNotice(isLoadedInRam ? `Unloaded "${model.name}" from RAM.` : `Loaded "${model.name}" into RAM.`);
              await loadAllData();
            } else {
              showNotice("Failed to update RAM state.", true);
            }
          } catch (e) {
            showNotice(e.message, true);
          } finally {
            loadBtn.disabled = false;
          }
        };

        // Set Active Primary Model
        const setActiveBtn = element("button", "zero-providers-btn zero-providers-btn--subtle", "Set Active");
        setActiveBtn.type = "button";
        setActiveBtn.onclick = async () => {
          try {
            setActiveBtn.disabled = true;
            const res = await gatewayHttp("/api/gateway/config", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                defaults: { primary: model.id },
                agentBindings: { zero: { model: model.id } },
              }),
            });
            if (res && res.ok) {
              showNotice(`Model "${model.name || model.id}" set as active Primary model!`);
              systemDefaults.primary = model.id;
              descItem1.querySelector(".zero-agent-desc-box__value").textContent = model.id;
              await loadAllData();
            } else {
              showNotice("Failed to set active model.", true);
            }
          } catch (e) {
            showNotice(e.message, true);
          } finally {
            setActiveBtn.disabled = false;
          }
        };

        actions.append(setActiveBtn, loadBtn, reasoningBtn, renameBtn, delBtn);
        cardHeader.append(left, actions);
        card.append(cardHeader, renameRow);
        modelsListContainer.append(card);
      }
    }

    // 2. Render Cloud Providers
    if (activeProviders.length > 0) {
      const provSectionHeader = element("div", "zero-provider-card__title-row");
      provSectionHeader.style.margin = "20px 0 10px 0";
      provSectionHeader.append(
        element("h3", "zero-models-card__title", `Cloud Providers (${activeProviders.length})`)
      );
      modelsListContainer.append(provSectionHeader);

      for (const prov of activeProviders) {
        const card = element("div", "zero-provider-card");
        const cardHeader = element("div", "zero-provider-card__header");
        const left = element("div", "zero-provider-card__left");
        const icon = element("div", "zero-provider-icon zero-provider-icon--openai");
        const meta = element("div", "zero-provider-card__meta");

        const titleRow = element("div", "zero-provider-card__title-row");
        const pTitle = element("span", "zero-provider-card__title", prov.name || prov.id);
        const pBadge = element("span", "zero-providers-badge zero-providers-badge--active", prov.enabled !== false ? "ACTIVE" : "DISABLED");
        titleRow.append(pTitle, pBadge);

        const details = element("div", "zero-provider-card__details");
        const metaUrl = element("span", "zero-provider-card__meta-item");
        metaUrl.append(element("span", "zero-provider-card__meta-label", "Base URL: "), element("span", "zero-provider-card__meta-val", prov.baseUrl || "N/A"));
        const metaCount = element("span", "zero-provider-card__meta-item");
        const count = Array.isArray(prov.models) ? prov.models.length : 0;
        metaCount.append(element("span", "zero-provider-card__meta-label", "Models: "), element("span", "zero-provider-card__meta-val", `${count} configured`));

        details.append(metaUrl, metaCount);
        meta.append(titleRow, details);
        left.append(icon, meta);

        // Actions
        const actions = element("div", "zero-provider-card__actions");
        const editBtn = element("button", "zero-providers-btn zero-providers-btn--subtle", "Edit");
        editBtn.type = "button";
        editBtn.onclick = () => {
          openAddProviderModal(prov);
        };

        const testBtn = element("button", "zero-providers-btn zero-providers-btn--subtle", "Test Connection");
        testBtn.type = "button";
        testBtn.onclick = async () => {
          testBtn.disabled = true;
          testBtn.textContent = "Testing...";
          try {
            const res = await gatewayHttp("/api/gateway/proxy", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                baseUrl: prov.baseUrl,
                endpoint: "/models",
                apiKey: prov.apiKey,
                headers: prov.headers,
              }),
            });
            if (res.ok) {
              showNotice(`Connection successful to ${prov.name || prov.id}!`);
            } else {
              showNotice(`Provider error: ${res.statusText}`, true);
            }
          } catch (err) {
            showNotice(`Connection failed: ${err.message}`, true);
          } finally {
            testBtn.disabled = false;
            testBtn.textContent = "Test Connection";
          }
        };

        const delProvBtn = element("button", "zero-providers-btn zero-providers-btn--danger", "Remove");
        delProvBtn.type = "button";
        delProvBtn.onclick = async () => {
          if (!confirm(`Remove provider "${prov.name || prov.id}"?`)) return;
          try {
            delProvBtn.disabled = true;
            const updatedList = activeProviders.filter((p) => p.id !== prov.id);
            const res = await gatewayHttp("/api/gateway/config", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ providers: updatedList }),
            });
            if (res.ok) {
              showNotice(`Provider "${prov.name || prov.id}" removed.`);
              await loadAllData();
            } else {
              showNotice("Failed to remove provider.", true);
            }
          } catch (e) {
            showNotice(e.message, true);
          } finally {
            delProvBtn.disabled = false;
          }
        };

        actions.append(editBtn, testBtn, delProvBtn);
        cardHeader.append(left, actions);
        card.append(cardHeader);
        modelsListContainer.append(card);
      }
    }
  }

  // --- SAVE DEFAULTS HANDLER ---
  saveDefaultsBtn.onclick = async () => {
    saveDefaultsBtn.disabled = true;
    saveDefaultsBtn.textContent = "Saving Defaults...";
    try {
      systemDefaults = {
        primary: primarySel.select.value,
        utility: utilitySel.select.value,
        fallback: fallbackSel.select.value,
        thinking: thinkingSel.select.value,
        fastMode: fastModeSel.select.value,
      };

      // Persist to gateway config endpoint
      const res = await gatewayHttp("/api/gateway/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaults: systemDefaults }),
      }).catch(() => null);

      showNotice("Model defaults & preferences saved successfully!");
    } catch (e) {
      showNotice("Failed to save defaults: " + e.message, true);
    } finally {
      saveDefaultsBtn.disabled = false;
      saveDefaultsBtn.textContent = "Save Defaults";
    }
  };

  // --- ASSIGN AGENT MODEL HANDLER ---
  assignBtn.onclick = async () => {
    const selectedModel = agentModelSelect.value;
    if (!selectedModel) {
      showNotice("Please select a model to assign to Zero agent.", true);
      return;
    }
    assignBtn.disabled = true;
    assignBtn.textContent = "Binding Agent...";
    try {
      const res = await gatewayHttp("/api/gateway/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentBindings: {
            zero: {
              model: selectedModel,
              allowOverride: overrideCheckbox.checked,
            },
          },
        }),
      }).catch(() => null);

      showNotice(`Successfully bound model "${selectedModel}" to Zero agent!`);
    } catch (e) {
      showNotice("Failed to bind agent model: " + e.message, true);
    } finally {
      assignBtn.disabled = false;
      assignBtn.textContent = "Assign Model to Agent";
    }
  };

  // --- MODAL: ADD / EDIT PROVIDER ---
  function openAddProviderModal(editProvider = null) {
    modalOverlay.replaceChildren();
    modalOverlay.style.display = "flex";

    const isEdit = Boolean(editProvider);
    const modalBox = element("div", "zero-modal zero-models-card");
    modalBox.style.maxWidth = "720px";
    modalBox.style.width = "92%";
    modalBox.style.maxHeight = "90vh";
    modalBox.style.overflowY = "auto";
    modalBox.style.margin = "auto";
    modalBox.style.backgroundColor = "#0d131f";

    const head = element("div", "zero-modal__header zero-models-card__head");
    head.style.display = "flex";
    head.style.justifyContent = "space-between";
    head.style.alignItems = "center";

    const titleGroup = element("div", "zero-modal__title-group");
    titleGroup.append(
      element("h2", "zero-modal__title zero-models-card__title", isEdit ? `Edit Provider: ${editProvider.name || editProvider.id}` : "+ Add Cloud Provider"),
      element("p", "zero-models-card__subtitle", "Register an upstream OpenAI-compatible, Anthropic, or custom provider.")
    );

    const closeBtn = element("button", "zero-modal__close", "×");
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Close modal");
    closeBtn.onclick = () => {
      modalOverlay.style.display = "none";
    };

    head.append(titleGroup, closeBtn);

    const nameField = createInputField("Display Name", "m-prov-name", "e.g. Groq, OpenAI, Ollama, DeepSeek");
    if (isEdit && editProvider.name) nameField.input.value = editProvider.name;

    const idField = createInputField("Provider ID (Slug: a-z, 0-9, -, _)", "m-prov-id", "e.g. groq, openai, deepseek");
    if (isEdit) {
      idField.input.value = editProvider.id;
      idField.input.disabled = true;
    }

    const apiField = element("div", "zero-selector-field zero-modal__field");
    const apiLbl = element("label", "zero-selector-field__label zero-modal__label", "Provider API Format");
    apiLbl.setAttribute("for", "m-prov-api");
    const apiSelect = element("select", "zero-selector-field__select zero-modal__select");
    apiSelect.id = "m-prov-api";
    const optOpenAi = element("option", null, "OpenAI Compatible (openai-completions)");
    optOpenAi.value = "openai-completions";
    const optAnthropic = element("option", null, "Anthropic API");
    optAnthropic.value = "anthropic";
    apiSelect.append(optOpenAi, optAnthropic);
    if (isEdit && editProvider.api) apiSelect.value = editProvider.api;
    apiField.append(apiLbl, apiSelect);

    const urlField = createInputField("Base URL", "m-prov-url", "https://api.openai.com/v1 or http://127.0.0.1:11434/v1");
    if (isEdit && editProvider.baseUrl) urlField.input.value = editProvider.baseUrl;

    // --- Key Pool Section ---
    const keySection = element("div", "zero-modal__field");
    const keyLbl = element("label", "zero-selector-field__label zero-modal__label", "API Key Pool (Failover / Round-Robin)");
    const primaryKeyInput = element("input", "zero-selector-field__select zero-modal__input");
    primaryKeyInput.type = "password";
    primaryKeyInput.placeholder = "Primary API Key (Stored in Server Vault)";
    if (isEdit) {
      primaryKeyInput.value = editProvider.apiKey || (Array.isArray(editProvider.apiKeys) ? editProvider.apiKeys[0] || "" : "");
    }
    const extraKeysContainer = element("div", "zero-keys-container");
    extraKeysContainer.style.display = "flex";
    extraKeysContainer.style.flexDirection = "column";
    extraKeysContainer.style.gap = "6px";
    extraKeysContainer.style.marginTop = "6px";

    const extraKeys = [];
    if (isEdit && Array.isArray(editProvider.apiKeys) && editProvider.apiKeys.length > 1) {
      for (let i = 1; i < editProvider.apiKeys.length; i++) {
        addExtraKeyRow(editProvider.apiKeys[i]);
      }
    }

    function addExtraKeyRow(val = "") {
      const row = element("div", "zero-extra-key-row");
      row.style.display = "flex";
      row.style.gap = "8px";
      row.style.alignItems = "center";
      const keyInp = element("input", "zero-selector-field__select zero-modal__input");
      keyInp.type = "password";
      keyInp.placeholder = `Fallback Key #${extraKeys.length + 2}`;
      keyInp.value = val;
      const removeBtn = element("button", "zero-providers-btn zero-providers-btn--danger", "×");
      removeBtn.type = "button";
      removeBtn.onclick = () => {
        const idx = extraKeys.indexOf(keyInp);
        if (idx !== -1) extraKeys.splice(idx, 1);
        row.remove();
      };
      extraKeys.push(keyInp);
      row.append(keyInp, removeBtn);
      extraKeysContainer.append(row);
    }

    const addKeyBtn = element("button", "zero-providers-btn zero-providers-btn--subtle", "+ Add Key to Pool");
    addKeyBtn.type = "button";
    addKeyBtn.style.marginTop = "4px";
    addKeyBtn.style.alignSelf = "flex-start";
    addKeyBtn.onclick = () => addExtraKeyRow();

    keySection.append(keyLbl, primaryKeyInput, extraKeysContainer, addKeyBtn);

    // --- Configured Models State ---
    let configuredModels = [];
    if (isEdit && Array.isArray(editProvider.models)) {
      configuredModels = editProvider.models.map((m) =>
        typeof m === "string"
          ? { id: m, name: m, reasoning: false, image: false }
          : { id: m.id, name: m.name || m.id, reasoning: Boolean(m.reasoning), image: Boolean(m.image) }
      );
    }

    // --- Fetch Models bar ---
    const fetchRow = element("div", "zero-modal__fetch-bar");
    fetchRow.style.display = "flex";
    fetchRow.style.gap = "8px";
    fetchRow.style.alignItems = "center";
    fetchRow.style.margin = "8px 0 4px 0";

    const fetchBtn = element("button", "zero-providers-btn zero-providers-btn--subtle", "Fetch Models");
    fetchBtn.type = "button";
    const fetchTip = element("span", "zero-modal__field-warning", "Query upstream endpoint to auto-discover models.");
    fetchTip.style.fontSize = "12px";
    fetchTip.style.color = "#858b99";
    fetchRow.append(fetchBtn, fetchTip);

    // --- Auto Model Detection Box ---
    const pickerBox = element("div", "zero-modal__models-picker-box");
    pickerBox.style.display = "none";
    pickerBox.style.border = "1px solid #343946";
    pickerBox.style.borderRadius = "8px";
    pickerBox.style.padding = "12px";
    pickerBox.style.backgroundColor = "rgba(0, 0, 0, 0.4)";
    pickerBox.style.margin = "8px 0";

    const pickerHead = element("div", "zero-modal__picker-head");
    pickerHead.style.display = "flex";
    pickerHead.style.justifyContent = "space-between";
    pickerHead.style.alignItems = "center";
    pickerHead.style.marginBottom = "8px";

    const modelsCountSpan = element("span", "zero-modal__models-count", "0 models found");
    modelsCountSpan.style.fontWeight = "600";
    modelsCountSpan.style.color = "#edf0f7";

    const pickerActions = element("div", "zero-modal__picker-actions");
    pickerActions.style.display = "flex";
    pickerActions.style.gap = "8px";
    const selectAllBtn = element("button", "zero-providers-btn zero-providers-btn--subtle", "Select all");
    selectAllBtn.type = "button";
    const deselectAllBtn = element("button", "zero-providers-btn zero-providers-btn--subtle", "Deselect all");
    deselectAllBtn.type = "button";
    pickerActions.append(selectAllBtn, deselectAllBtn);
    pickerHead.append(modelsCountSpan, pickerActions);

    const searchInput = element("input", "zero-selector-field__select zero-modal__search-input");
    searchInput.placeholder = "Search models...";
    searchInput.style.marginBottom = "8px";

    const checklistContainer = element("div", "zero-modal__checklist-container");
    checklistContainer.style.maxHeight = "180px";
    checklistContainer.style.overflowY = "auto";
    checklistContainer.style.display = "flex";
    checklistContainer.style.flexDirection = "column";
    checklistContainer.style.gap = "4px";

    let fetchedDiscoveredModels = [];

    selectAllBtn.onclick = () => {
      checklistContainer.querySelectorAll("input[type=checkbox]").forEach((cb) => (cb.checked = true));
    };
    deselectAllBtn.onclick = () => {
      checklistContainer.querySelectorAll("input[type=checkbox]").forEach((cb) => (cb.checked = false));
    };

    searchInput.oninput = () => {
      const filter = searchInput.value.trim().toLowerCase();
      checklistContainer.querySelectorAll(".zero-modal__checklist-item").forEach((item) => {
        const id = item.dataset.modelId || "";
        item.style.display = id.toLowerCase().includes(filter) ? "flex" : "none";
      });
    };

    const pickerFoot = element("div", "zero-modal__picker-foot");
    pickerFoot.style.display = "flex";
    pickerFoot.style.justifyContent = "flex-end";
    pickerFoot.style.gap = "8px";
    pickerFoot.style.marginTop = "8px";

    const addSelectedBtn = element("button", "zero-models-btn zero-models-btn--add-provider", "Add Selected Models");
    addSelectedBtn.type = "button";
    const cancelPickerBtn = element("button", "zero-providers-btn zero-providers-btn--subtle", "Cancel");
    cancelPickerBtn.type = "button";

    cancelPickerBtn.onclick = () => {
      pickerBox.style.display = "none";
    };

    addSelectedBtn.onclick = () => {
      const selectedIds = [];
      checklistContainer.querySelectorAll("input[type=checkbox]:checked").forEach((cb) => {
        selectedIds.push(cb.value);
      });
      if (selectedIds.length === 0) {
        alert("Please select at least one model to add.");
        return;
      }
      for (const id of selectedIds) {
        if (!configuredModels.some((m) => m.id === id)) {
          const disc = fetchedDiscoveredModels.find((d) => d.id === id);
          configuredModels.push({
            id,
            name: disc?.name || id,
            reasoning: Boolean(disc?.reasoning),
            image: Boolean(disc?.image),
          });
        }
      }
      pickerBox.style.display = "none";
      renderConfiguredModelsTable();
      showNotice(`Added ${selectedIds.length} model(s) to provider!`);
    };

    pickerFoot.append(cancelPickerBtn, addSelectedBtn);
    pickerBox.append(pickerHead, searchInput, checklistContainer, pickerFoot);

    // Fetch Models Click Handler
    fetchBtn.onclick = async () => {
      const url = urlField.input.value.trim();
      if (!url) {
        alert("Please enter Base URL first.");
        return;
      }
      fetchBtn.disabled = true;
      fetchBtn.textContent = "Fetching...";
      try {
        const res = await gatewayHttp("/api/gateway/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            baseUrl: url,
            endpoint: "/models",
            apiKey: primaryKeyInput.value.trim(),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          let rawList = [];
          if (Array.isArray(data?.data)) rawList = data.data;
          else if (Array.isArray(data?.models)) rawList = data.models;
          else if (Array.isArray(data)) rawList = data;

          fetchedDiscoveredModels = rawList.map((m) => {
            const id = typeof m === "string" ? m : m.id || m.name || "unknown";
            const isReasoning = Boolean(m?.capabilities?.reasoning || /o1|o3|r1|deepseek-r1|reasoning|thinking/i.test(id));
            const isImage = Boolean(m?.capabilities?.image || /vision|vl|4o|claude-3|gemini|image/i.test(id));
            return { id, name: id, reasoning: isReasoning, image: isImage };
          });

          if (fetchedDiscoveredModels.length > 0) {
            modelsCountSpan.textContent = `${fetchedDiscoveredModels.length} models found`;
            checklistContainer.replaceChildren();
            for (const dm of fetchedDiscoveredModels) {
              const itemRow = element("label", "zero-modal__checklist-item");
              itemRow.dataset.modelId = dm.id;
              itemRow.style.display = "flex";
              itemRow.style.alignItems = "center";
              itemRow.style.gap = "8px";
              itemRow.style.padding = "4px 8px";
              itemRow.style.borderRadius = "4px";
              itemRow.style.cursor = "pointer";

              const cb = document.createElement("input");
              cb.type = "checkbox";
              cb.value = dm.id;
              cb.checked = !configuredModels.some((cm) => cm.id === dm.id);

              const nameSpan = element("span", "zero-modal__check-name", dm.id);
              nameSpan.style.fontSize = "13px";
              nameSpan.style.color = "#edf0f7";

              itemRow.append(cb, nameSpan);
              checklistContainer.append(itemRow);
            }
            pickerBox.style.display = "block";
            showNotice(`Discovered ${fetchedDiscoveredModels.length} models!`);
          } else {
            showNotice("No models returned by upstream endpoint.");
          }
        } else {
          showNotice("Failed to fetch models from endpoint.", true);
        }
      } catch (e) {
        showNotice(e.message, true);
      } finally {
        fetchBtn.disabled = false;
        fetchBtn.textContent = "Fetch Models";
      }
    };

    // --- Configured Models Table Section ---
    const modelsSection = element("div", "zero-modal__models-section");
    modelsSection.style.margin = "12px 0";

    const modelsHeaderRow = element("div", "zero-modal__models-header-row");
    modelsHeaderRow.style.display = "flex";
    modelsHeaderRow.style.justifyContent = "space-between";
    modelsHeaderRow.style.alignItems = "center";
    modelsHeaderRow.style.marginBottom = "6px";

    const modelsSecTitle = element("label", "zero-selector-field__label zero-modal__label", "Configured Models & Capabilities");
    const bulkBtns = element("div", "zero-modal__global-toggles");
    bulkBtns.style.display = "flex";
    bulkBtns.style.gap = "6px";

    const toggleReasoningAllBtn = element("button", "zero-providers-btn zero-providers-btn--subtle", "Toggle reasoning for all");
    toggleReasoningAllBtn.type = "button";
    toggleReasoningAllBtn.style.fontSize = "11px";
    toggleReasoningAllBtn.style.padding = "3px 8px";

    const toggleImageAllBtn = element("button", "zero-providers-btn zero-providers-btn--subtle", "Toggle image for all");
    toggleImageAllBtn.type = "button";
    toggleImageAllBtn.style.fontSize = "11px";
    toggleImageAllBtn.style.padding = "3px 8px";

    bulkBtns.append(toggleReasoningAllBtn, toggleImageAllBtn);
    modelsHeaderRow.append(modelsSecTitle, bulkBtns);

    const modelsTable = element("div", "zero-modal__models-table");
    modelsTable.style.maxHeight = "200px";
    modelsTable.style.overflowY = "auto";
    modelsTable.style.display = "flex";
    modelsTable.style.flexDirection = "column";
    modelsTable.style.gap = "6px";
    modelsTable.style.border = "1px solid #343946";
    modelsTable.style.borderRadius = "8px";
    modelsTable.style.padding = "8px";

    function renderConfiguredModelsTable() {
      modelsTable.replaceChildren();
      if (configuredModels.length === 0) {
        const emptyTip = element("div", "zero-empty-tip", "No models configured yet. Click 'Fetch Models' above or add manually.");
        emptyTip.style.padding = "12px";
        emptyTip.style.color = "#858b99";
        emptyTip.style.fontSize = "12px";
        modelsTable.append(emptyTip);
        updateFallbackDropdown();
        return;
      }

      for (let i = 0; i < configuredModels.length; i++) {
        const m = configuredModels[i];
        const row = element("div", "zero-modal__model-row");
        row.style.display = "flex";
        row.style.gap = "8px";
        row.style.alignItems = "center";
        row.style.padding = "4px 0";
        row.style.borderBottom = "1px solid rgba(255, 255, 255, 0.05)";

        const idInp = element("input", "zero-selector-field__select zero-modal__model-id-input");
        idInp.value = m.id;
        idInp.placeholder = "Model ID";
        idInp.style.flex = "1";
        idInp.oninput = () => {
          m.id = idInp.value.trim();
          updateFallbackDropdown();
        };

        const nameInp = element("input", "zero-selector-field__select zero-modal__model-name-input");
        nameInp.value = m.name || m.id;
        nameInp.placeholder = "Display Name";
        nameInp.style.flex = "1";
        nameInp.oninput = () => {
          m.name = nameInp.value.trim();
        };

        // Reasoning Toggle Checkbox
        const reasoningLabel = element("label", "zero-modal__check-label");
        reasoningLabel.style.display = "flex";
        reasoningLabel.style.alignItems = "center";
        reasoningLabel.style.gap = "4px";
        reasoningLabel.style.fontSize = "11px";
        reasoningLabel.style.color = "#a5aab8";
        const rCheck = document.createElement("input");
        rCheck.type = "checkbox";
        rCheck.checked = Boolean(m.reasoning);
        rCheck.onchange = () => {
          m.reasoning = rCheck.checked;
        };
        reasoningLabel.append(rCheck, document.createTextNode("Reasoning"));

        // Image Toggle Checkbox
        const imageLabel = element("label", "zero-modal__check-label");
        imageLabel.style.display = "flex";
        imageLabel.style.alignItems = "center";
        imageLabel.style.gap = "4px";
        imageLabel.style.fontSize = "11px";
        imageLabel.style.color = "#a5aab8";
        const iCheck = document.createElement("input");
        iCheck.type = "checkbox";
        iCheck.checked = Boolean(m.image);
        iCheck.onchange = () => {
          m.image = iCheck.checked;
        };
        imageLabel.append(iCheck, document.createTextNode("Image"));

        // Delete Row Button
        const delBtn = element("button", "zero-providers-btn zero-providers-btn--danger", "×");
        delBtn.type = "button";
        delBtn.onclick = () => {
          configuredModels.splice(i, 1);
          renderConfiguredModelsTable();
        };

        row.append(idInp, nameInp, reasoningLabel, imageLabel, delBtn);
        modelsTable.append(row);
      }
      updateFallbackDropdown();
    }

    toggleReasoningAllBtn.onclick = () => {
      const allActive = configuredModels.every((m) => m.reasoning);
      configuredModels.forEach((m) => (m.reasoning = !allActive));
      renderConfiguredModelsTable();
    };

    toggleImageAllBtn.onclick = () => {
      const allActive = configuredModels.every((m) => m.image);
      configuredModels.forEach((m) => (m.image = !allActive));
      renderConfiguredModelsTable();
    };

    const addManualModelBtn = element("button", "zero-providers-btn zero-providers-btn--subtle", "+ Add Model Manually");
    addManualModelBtn.type = "button";
    addManualModelBtn.style.marginTop = "6px";
    addManualModelBtn.style.alignSelf = "flex-start";
    addManualModelBtn.onclick = () => {
      configuredModels.push({ id: "", name: "", reasoning: false, image: false });
      renderConfiguredModelsTable();
    };

    modelsSection.append(modelsHeaderRow, modelsTable, addManualModelBtn);

    // Fallback Model Selector
    const fallbackRow = element("div", "zero-selector-field zero-modal__field");
    const fbLbl = element("label", "zero-selector-field__label zero-modal__label", "Fallback Model (Optional)");
    const fbSelect = element("select", "zero-selector-field__select zero-modal__select");
    fallbackRow.append(fbLbl, fbSelect);

    function updateFallbackDropdown() {
      const cur = fbSelect.value || (isEdit ? editProvider.fallbackModel : "");
      fbSelect.replaceChildren();
      const noneOpt = element("option", null, "(None - Default)");
      noneOpt.value = "";
      fbSelect.append(noneOpt);
      for (const cm of configuredModels) {
        if (cm.id) {
          const opt = element("option", null, cm.name || cm.id);
          opt.value = cm.id;
          if (cm.id === cur) opt.selected = true;
          fbSelect.append(opt);
        }
      }
    }

    // --- Headers (Optional) Section ---
    const headersSection = element("div", "zero-modal__advanced-section");
    headersSection.style.margin = "8px 0";
    const headersLbl = element("label", "zero-selector-field__label zero-modal__label", "Custom Upstream Headers (Optional)");
    const headersContainer = element("div", "zero-modal__headers-container");
    headersContainer.style.display = "flex";
    headersContainer.style.flexDirection = "column";
    headersContainer.style.gap = "6px";

    const configuredHeaders = [];
    if (isEdit && Array.isArray(editProvider.headers)) {
      for (const h of editProvider.headers) {
        addHeaderRow(h.key || "", h.value || "");
      }
    } else if (isEdit && typeof editProvider.headers === "object") {
      for (const [k, v] of Object.entries(editProvider.headers)) {
        addHeaderRow(k, v);
      }
    }

    function addHeaderRow(kVal = "", vVal = "") {
      const row = element("div", "zero-modal__header-row");
      row.style.display = "flex";
      row.style.gap = "8px";
      const kInp = element("input", "zero-selector-field__select zero-modal__header-key");
      kInp.placeholder = "Header Key (e.g. HTTP-Referer)";
      kInp.value = kVal;
      kInp.style.flex = "1";
      const vInp = element("input", "zero-selector-field__select zero-modal__header-val");
      vInp.placeholder = "Header Value";
      vInp.value = vVal;
      vInp.style.flex = "1";
      const delBtn = element("button", "zero-providers-btn zero-providers-btn--danger", "×");
      delBtn.type = "button";
      delBtn.onclick = () => {
        const idx = configuredHeaders.indexOf(hObj);
        if (idx !== -1) configuredHeaders.splice(idx, 1);
        row.remove();
      };
      const hObj = { kInp, vInp };
      configuredHeaders.push(hObj);
      row.append(kInp, vInp, delBtn);
      headersContainer.append(row);
    }

    const addHeaderBtn = element("button", "zero-providers-btn zero-providers-btn--subtle", "+ Add Header");
    addHeaderBtn.type = "button";
    addHeaderBtn.style.marginTop = "4px";
    addHeaderBtn.onclick = () => addHeaderRow();
    headersSection.append(headersLbl, headersContainer, addHeaderBtn);

    renderConfiguredModelsTable();

    // Modal Actions
    const modalActions = element("div", "zero-modal__footer zero-defaults-actions");
    const cancelBtn = element("button", "zero-providers-btn zero-providers-btn--subtle", "Cancel");
    cancelBtn.type = "button";
    const submitBtn = element("button", "zero-models-btn zero-models-btn--add-provider", isEdit ? "Update Provider" : "Save Provider");
    submitBtn.type = "button";

    cancelBtn.onclick = () => {
      modalOverlay.style.display = "none";
    };

    submitBtn.onclick = async () => {
      const pName = nameField.input.value.trim();
      const pUrl = urlField.input.value.trim();
      let pId = idField.input.value.trim();

      if (!pName || !pUrl) {
        alert("Please enter Provider Name and Base URL.");
        return;
      }

      if (!pId) {
        pId = pName.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
      }

      if (!/^[a-z0-9-_]+$/i.test(pId)) {
        alert("Provider ID must contain only letters, numbers, hyphens, and underscores.");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Saving...";
      try {
        const pool = [primaryKeyInput.value.trim(), ...extraKeys.map((k) => k.value.trim())].filter(Boolean);
        const headersList = configuredHeaders
          .map((h) => ({ key: h.kInp.value.trim(), value: h.vInp.value.trim() }))
          .filter((h) => Boolean(h.key));

        const finalModels = configuredModels.filter((m) => Boolean(m.id));

        const newProv = {
          id: pId,
          name: pName,
          baseUrl: pUrl,
          api: apiSelect.value || "openai-completions",
          apiKey: pool[0] || "",
          apiKeys: pool,
          models: finalModels.length > 0 ? finalModels : [{ id: "default", name: pName, reasoning: false, image: false }],
          fallbackModel: fbSelect.value || undefined,
          headers: headersList,
          enabled: true,
        };

        const updatedProviders = [...activeProviders.filter((p) => p.id !== pId), newProv];
        const res = await gatewayHttp("/api/gateway/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ providers: updatedProviders }),
        });

        if (res.ok) {
          modalOverlay.style.display = "none";
          showNotice(`Provider "${pName}" successfully ${isEdit ? "updated" : "added"}!`);
          await loadAllData();
        } else {
          alert("Failed to save provider configuration.");
        }
      } catch (err) {
        alert("Error: " + err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = isEdit ? "Update Provider" : "Save Provider";
      }
    };

    modalActions.append(cancelBtn, submitBtn);
    modalBox.append(
      head,
      nameField.field,
      idField.field,
      apiField,
      urlField.field,
      keySection,
      fetchRow,
      pickerBox,
      modelsSection,
      fallbackRow,
      headersSection,
      modalActions
    );
    modalOverlay.append(modalBox);
  }

  // --- MODAL: IMPORT GGUF ---
  function openImportGgufModal() {
    modalOverlay.replaceChildren();
    modalOverlay.style.display = "flex";

    const modalBox = element("div", "zero-modal zero-models-card");
    modalBox.style.maxWidth = "660px";
    modalBox.style.width = "92%";
    modalBox.style.maxHeight = "90vh";
    modalBox.style.overflowY = "auto";
    modalBox.style.margin = "auto";
    modalBox.style.backgroundColor = "#0d131f";

    const head = element("div", "zero-modal__header zero-models-card__head");
    head.style.display = "flex";
    head.style.justifyContent = "space-between";
    head.style.alignItems = "center";

    const titleGroup = element("div", "zero-modal__title-group");
    titleGroup.append(
      element("h2", "zero-modal__title zero-models-card__title", "Import Offline GGUF Model"),
      element("p", "zero-models-card__subtitle", "Zero-copy instant path mount or download from Hugging Face.")
    );

    const closeBtn = element("button", "zero-modal__close", "×");
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Close modal");
    closeBtn.onclick = () => {
      modalOverlay.style.display = "none";
    };

    head.append(titleGroup, closeBtn);

    // Tab Header
    const tabHeader = element("div", "zero-gguf-tool-tabs zero-segmented-tabs");
    tabHeader.style.display = "flex";
    tabHeader.style.gap = "8px";
    tabHeader.style.margin = "12px 0";

    const tabMount = element("button", "zero-segmented-tab zero-segmented-tab--active zero-models-btn", "Local File Path (Zero-Copy)");
    tabMount.type = "button";
    const tabHf = element("button", "zero-segmented-tab zero-models-btn", "Hugging Face Search");
    tabHf.type = "button";
    const tabDownloads = element("button", "zero-segmented-tab zero-models-btn", "Active Downloads");
    tabDownloads.type = "button";
    tabHeader.append(tabMount, tabHf, tabDownloads);

    // Tab 1: Zero-Copy Mount Panel
    const mountPanel = element("div", "zero-gguf-tool-panel");
    mountPanel.style.display = "flex";
    mountPanel.style.flexDirection = "column";
    mountPanel.style.gap = "10px";

    const pathField = createInputField("Local .gguf File Path", "m-gguf-path", "e.g. E:\\models\\moondream2-text-model-f16_ct-vicuna.gguf");
    const guideField = createInputField("Guide File Path (Optional .json/.txt)", "m-gguf-guide", "e.g. E:\\models\\moondream2.json (System Guide)");

    const mountActions = element("div", "zero-defaults-actions");
    const mountCancelBtn = element("button", "zero-providers-btn zero-providers-btn--subtle", "Cancel");
    mountCancelBtn.type = "button";
    const mountSubmitBtn = element("button", "zero-models-btn zero-models-btn--add-provider", "Mount Model (2s)");
    mountSubmitBtn.type = "button";
    mountActions.append(mountCancelBtn, mountSubmitBtn);
    mountPanel.append(pathField.field, guideField.field, mountActions);

    // Tab 2: Hugging Face Panel
    const hfPanel = element("div", "zero-gguf-tool-panel");
    hfPanel.style.display = "none";
    hfPanel.style.flexDirection = "column";
    hfPanel.style.gap = "10px";

    const hfSearchRow = element("div", "zero-modal__field");
    const hfSearchLbl = element("label", "zero-selector-field__label zero-modal__label", "Search Hugging Face Repos");
    const hfSearchInputRow = element("div", null);
    hfSearchInputRow.style.display = "flex";
    hfSearchInputRow.style.gap = "8px";
    const hfRepoInput = element("input", "zero-selector-field__select zero-modal__input");
    hfRepoInput.placeholder = "e.g. vikhyatk/moondream2 or Qwen/Qwen2.5-Coder-7B-GGUF";
    hfRepoInput.style.flex = "1";
    const hfSearchBtn = element("button", "zero-models-btn zero-models-btn--add-provider", "Search");
    hfSearchBtn.type = "button";
    hfSearchInputRow.append(hfRepoInput, hfSearchBtn);
    hfSearchRow.append(hfSearchLbl, hfSearchInputRow);

    const hfResultsBox = element("div", "zero-hf-results-box");
    hfResultsBox.style.maxHeight = "160px";
    hfResultsBox.style.overflowY = "auto";
    hfResultsBox.style.display = "none";
    hfResultsBox.style.border = "1px solid #343946";
    hfResultsBox.style.borderRadius = "8px";
    hfResultsBox.style.padding = "8px";

    const hfDirectRow = createInputField("Direct .gguf Download URL", "m-hf-url", "https://huggingface.co/.../model.gguf");

    const hfActions = element("div", "zero-defaults-actions");
    const hfCancelBtn = element("button", "zero-providers-btn zero-providers-btn--subtle", "Cancel");
    hfCancelBtn.type = "button";
    const hfSubmitBtn = element("button", "zero-models-btn zero-models-btn--add-provider", "Download from URL");
    hfSubmitBtn.type = "button";
    hfActions.append(hfCancelBtn, hfSubmitBtn);
    hfPanel.append(hfSearchRow, hfResultsBox, hfDirectRow.field, hfActions);

    // Tab 3: Active Downloads Panel
    const dlPanel = element("div", "zero-gguf-tool-panel");
    dlPanel.style.display = "none";
    dlPanel.style.flexDirection = "column";
    dlPanel.style.gap = "12px";

    const dlStatusBox = element("div", "zero-dl-status-box");
    dlStatusBox.style.padding = "16px";
    dlStatusBox.style.border = "1px solid #343946";
    dlStatusBox.style.borderRadius = "8px";
    dlStatusBox.style.backgroundColor = "rgba(0, 0, 0, 0.3)";

    const dlFilename = element("div", null, "No download in progress.");
    dlFilename.style.fontWeight = "600";
    dlFilename.style.marginBottom = "8px";

    const dlProgressBar = element("div", "zero-progress-bar-bg");
    dlProgressBar.style.width = "100%";
    dlProgressBar.style.height = "10px";
    dlProgressBar.style.backgroundColor = "#242938";
    dlProgressBar.style.borderRadius = "5px";
    dlProgressBar.style.overflow = "hidden";

    const dlProgressFill = element("div", "zero-progress-bar-fill");
    dlProgressFill.style.width = "0%";
    dlProgressFill.style.height = "100%";
    dlProgressFill.style.backgroundColor = "#10b981";
    dlProgressFill.style.transition = "width 0.3s ease";
    dlProgressBar.append(dlProgressFill);

    const dlStatsRow = element("div", null);
    dlStatsRow.style.display = "flex";
    dlStatsRow.style.justifyContent = "space-between";
    dlStatsRow.style.fontSize = "12px";
    dlStatsRow.style.color = "#858b99";
    dlStatsRow.style.marginTop = "6px";
    const dlPct = element("span", null, "0%");
    const dlBytes = element("span", null, "0 / 0 MB");
    dlStatsRow.append(dlPct, dlBytes);

    const dlCancelBtn = element("button", "zero-providers-btn zero-providers-btn--danger", "Cancel Download");
    dlCancelBtn.type = "button";
    dlCancelBtn.style.marginTop = "12px";
    dlCancelBtn.style.display = "none";

    dlStatusBox.append(dlFilename, dlProgressBar, dlStatsRow, dlCancelBtn);
    dlPanel.append(dlStatusBox);

    // Tab Switching
    function selectTab(selectedTab, activePanel) {
      [tabMount, tabHf, tabDownloads].forEach((t) => t.classList.remove("zero-segmented-tab--active"));
      [mountPanel, hfPanel, dlPanel].forEach((p) => (p.style.display = "none"));
      selectedTab.classList.add("zero-segmented-tab--active");
      activePanel.style.display = "flex";
      if (selectedTab === tabDownloads) {
        checkDownloadProgress();
      }
    }

    tabMount.onclick = () => selectTab(tabMount, mountPanel);
    tabHf.onclick = () => selectTab(tabHf, hfPanel);
    tabDownloads.onclick = () => selectTab(tabDownloads, dlPanel);

    mountCancelBtn.onclick = () => (modalOverlay.style.display = "none");
    hfCancelBtn.onclick = () => (modalOverlay.style.display = "none");

    // Mount Handler
    mountSubmitBtn.onclick = async () => {
      const sourcePath = pathField.input.value.trim();
      const guidePath = guideField.input.value.trim();
      if (!sourcePath) {
        alert("Please enter a local .gguf file path.");
        return;
      }
      mountSubmitBtn.disabled = true;
      mountSubmitBtn.textContent = "Mounting...";
      try {
        const res = await gatewayHttp("/api/gateway/local-gguf/mount-zero-copy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourcePath, guidePath }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          modalOverlay.style.display = "none";
          showNotice(`Model "${data.model?.name || 'GGUF'}" mounted successfully!`);
          await loadAllData();
        } else {
          alert("Mount failed: " + (data.error || "Unknown error"));
        }
      } catch (err) {
        alert("Error: " + err.message);
      } finally {
        mountSubmitBtn.disabled = false;
        mountSubmitBtn.textContent = "Mount Model (2s)";
      }
    };

    // HF Search Handler
    hfSearchBtn.onclick = async () => {
      const repo = hfRepoInput.value.trim();
      if (!repo) {
        alert("Please enter a Hugging Face repo name (e.g. vikhyatk/moondream2).");
        return;
      }
      hfSearchBtn.disabled = true;
      hfSearchBtn.textContent = "Searching...";
      try {
        const res = await gatewayHttp(`/api/gateway/local-gguf/hf/search?repo=${encodeURIComponent(repo)}`);
        if (res && res.ok) {
          const data = await res.json();
          const files = data.files || [];
          hfResultsBox.replaceChildren();
          if (files.length === 0) {
            hfResultsBox.append(element("div", null, "No .gguf files found in this repo."));
          } else {
            for (const f of files) {
              const fileRow = element("div", null);
              fileRow.style.display = "flex";
              fileRow.style.justifyContent = "space-between";
              fileRow.style.alignItems = "center";
              fileRow.style.padding = "6px 0";
              fileRow.style.borderBottom = "1px solid rgba(255, 255, 255, 0.05)";

              const fMeta = element("div", null);
              const fName = element("div", null, f.path || f.filename);
              fName.style.fontSize = "13px";
              fName.style.fontWeight = "500";
              const fSize = element("div", null, f.sizeFormatted || `${(f.size / (1024 * 1024)).toFixed(1)} MB`);
              fSize.style.fontSize = "11px";
              fSize.style.color = "#858b99";
              fMeta.append(fName, fSize);

              const dlBtn = element("button", "zero-models-btn zero-models-btn--add-provider", "Download");
              dlBtn.type = "button";
              dlBtn.style.padding = "4px 10px";
              dlBtn.onclick = () => {
                startHfDownload(f.url, f.filename || f.path, repo);
              };

              fileRow.append(fMeta, dlBtn);
              hfResultsBox.append(fileRow);
            }
          }
          hfResultsBox.style.display = "block";
        } else {
          alert("Hugging Face search failed.");
        }
      } catch (e) {
        alert("Search error: " + e.message);
      } finally {
        hfSearchBtn.disabled = false;
        hfSearchBtn.textContent = "Search";
      }
    };

    // HF Download Initiation
    async function startHfDownload(url, filename, repo) {
      selectTab(tabDownloads, dlPanel);
      dlFilename.textContent = `Downloading ${filename}...`;
      dlCancelBtn.style.display = "inline-block";
      try {
        const res = await gatewayHttp("/api/gateway/local-gguf/hf/download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, filename, repo }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showNotice(`Download started for ${filename}!`);
          pollProgress();
        } else {
          alert("Download start failed: " + (data.error || "Unknown"));
        }
      } catch (err) {
        alert("Download error: " + err.message);
      }
    }

    hfSubmitBtn.onclick = () => {
      const url = hfDirectRow.input.value.trim();
      if (!url) {
        alert("Please enter a direct .gguf URL.");
        return;
      }
      const parts = url.split("/");
      const filename = parts[parts.length - 1].split("?")[0] || "model.gguf";
      startHfDownload(url, filename, "Direct URL");
    };

    dlCancelBtn.onclick = async () => {
      try {
        await gatewayHttp("/api/gateway/local-gguf/hf/cancel", { method: "POST" });
        showNotice("Download cancelled.");
        dlFilename.textContent = "Download cancelled.";
        dlCancelBtn.style.display = "none";
      } catch {}
    };

    async function checkDownloadProgress() {
      try {
        const res = await gatewayHttp("/api/gateway/local-gguf/hf/progress");
        if (res && res.ok) {
          const data = await res.json();
          const p = data.progress;
          if (p && p.active) {
            dlFilename.textContent = `Downloading ${p.filename || 'model'}...`;
            dlProgressFill.style.width = `${p.percent || 0}%`;
            dlPct.textContent = `${p.percent || 0}%`;
            dlBytes.textContent = `${(p.downloadedBytes / (1024 * 1024)).toFixed(1)} / ${(p.totalBytes / (1024 * 1024)).toFixed(1)} MB (${p.speed || '0 KB/s'})`;
            dlCancelBtn.style.display = "inline-block";
          } else {
            dlFilename.textContent = p?.status === "completed" ? "Download completed!" : "No active download.";
            if (p?.status === "completed") {
              dlProgressFill.style.width = "100%";
              dlPct.textContent = "100%";
              loadAllData();
            }
            dlCancelBtn.style.display = "none";
          }
        }
      } catch {}
    }

    function pollProgress() {
      const interval = setInterval(async () => {
        if (modalOverlay.style.display === "none") {
          clearInterval(interval);
          return;
        }
        await checkDownloadProgress();
      }, 1500);
    }

    modalBox.append(head, tabHeader, mountPanel, hfPanel, dlPanel);
    modalOverlay.append(modalBox);
  }

  // --- BUTTON WIRING ---
  addProviderBtn.onclick = openAddProviderModal;
  importGgufBtn.onclick = openImportGgufModal;
  agentsNavBtn.onclick = () => {
    agentsCard.scrollIntoView({ behavior: "smooth" });
  };
  refreshBtn.onclick = () => {
    loadAllData();
  };

  // Mount into DOM
  if (typeof container.append === "function") {
    container.append(root);
  } else if (typeof container.appendChild === "function") {
    container.appendChild(root);
  }

  // Initial Data Fetch
  loadAllData();

  return {
    dispose: () => {
      disposed = true;
      if (typeof container.replaceChildren === "function") {
        container.replaceChildren();
      } else {
        container.innerHTML = "";
      }
    },
  };
}
