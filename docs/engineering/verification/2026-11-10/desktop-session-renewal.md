# Native desktop session renewal

The first-party UI now keeps its native HttpOnly desktop cookie alive without a popup, bearer storage or a page reload. An active session renews the same bearer and preserves its original role, scopes and creation time. The server atomically persists the extended expiry; an actual filesystem failure rolls back the in-memory change. New session creation prunes expired records.

The browser checks the native host's explicit renewal capability, schedules before expiry, and wakes on online/focus/visibility events. A cookie that actually expired during an unavailable connection can use the existing loopback bootstrap. Explicit logout sets a separate HttpOnly marker so the keeper does not undo sign-out. The expiry endpoints are same-origin HTTP because renewing an HttpOnly cookie requires a response cookie; all application data continues through the existing Gateway. No second chat/model authority or new permission flow was introduced.

## Actual outcomes

- `artifacts/ui-design/session-final-regression.log`: **6 reported PASS**, including one suite container. Actual browser renewal past the original four-second wall-clock expiry, independent durable metadata, authenticated memory effect, stopped/restarted host recovery, expired-cookie recovery, logout, narrow-scope preservation and actual HTTP 401/405/403 outcomes. A second browser test injects HTTP failure and supplies an online event; these are explicitly controlled faults, not a real internet outage.
- `artifacts/ui-design/session-persistence-rollback.log`: **1 PASS**, actual renewed metadata restored in a fresh Node process, revocation persisted, raw bearer absent from disk, and actual rename failure preserved durable bytes and rolled back in-memory expiry.
- `artifacts/ui-design/session-ui-final-regression.log`: **104 PASS**, existing UI package source/DOM/contracts. The earlier two source-contract failures remain in `session-ui-regression.log`; their overly broad no-fetch assertion now permits exactly the dedicated same-origin cookie lifecycle call. Actual cookie functionality is established by the separate browser effects.
- `artifacts/ui-design/session-audit-browser-regression.log`: **19 PASS**, metadata/reporting checks, persisted session store, actual live-widget rendering and Zero shell navigation. Overlapping checks are not additive acceptance totals.

The initial browser run (`session-renewal-real.log`) failed by expecting a deliberately four-second bearer to survive a longer real restart. Its failure remains recorded. The corrected test verifies restoration when still valid, refuses resurrection when expired, and independently requires authenticated recovery plus preservation of the memory written before restart. No test clock was advanced or mocked.

Current generation: `9b8bd92956453e64def20526d523660302f3a27d780033374f9c1837489f6eec`. Source census: 113 test sources, 95 reviewed additional sources, 622 lexical declarations including containers, 14 standalone runners. Inventory integrity means no product workflows ran.

This is bounded real expiry/recovery evidence, not a 24-hour run, exhaustive authorization audit or production sign-off. The owner-withdrawn endurance test was not restarted. Full release and external-device gates remain open.

References: [Fetch same-origin credentials](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch), [Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie), [page visibility and background timer policies](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API).
