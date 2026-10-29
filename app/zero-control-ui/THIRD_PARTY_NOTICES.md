# Third-party notices — Zero Control UI

## OpenMausBot

Patterns in Zero's native Desktop surface (`/systems` → Desktop) and its computer-control hold are
adapted from OpenMausBot:

- a human takeover is a lease that refuses agent input rather than queuing it;
- only the owning client releases the lease;
- the lease is given back when the view is left;
- hold state is read before it is shown, and the UI labels the hold as global.

These are independently implemented behavior patterns; no OpenMausBot source lines are copied.

Source: <https://github.com/milind-soni/OpenMausBot>  
Copyright 2026 Milind Soni and OpenMausBot contributors  
License: Apache License 2.0 (the `enterprise/` carve-out is not used)

No OpenMausBot enterprise code, product name, or mascot is included. Zero keeps
its own name, UI, Gateway transport, and session/history owner.

## Kilo Code

Interaction workflows in the Zero Models & Providers manager (provider list/edit, write-only credentials, debounced model discovery, search, select-all, and manual model entry) reference patterns from the Kilo Code VS Code extension:

Source: <https://github.com/Kilo-Org/kilo-code>  
Copyright 2025-2026 Kilo Code Contributors  
License: MIT License  

Zero adapts these interaction patterns into its plain-DOM OpenClaw Control UI architecture using native Gateway RPCs. No proprietary runtime, proxy, or secret-leaking state is imported.

