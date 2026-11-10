# Skill acquisition and shutdown correction

Pinned GitHub Skills now use a complete immutable HTTPS archive instead of fetching an unrelated Git HEAD. The selected subtree includes supporting files. Download, expansion, entry counts and file sizes are bounded; traversal, links, special files, path collisions and Windows device paths are rejected before extraction. Extracted files must match the validated archive sizes and SHA-256 hashes. This establishes transport/content consistency, not a publisher signature. Branch references retain actual Git revision resolution.

Git timeout, explicit cancellation and graceful host shutdown now terminate and await the owned process tree. Unconfirmed cleanup fails explicitly and retains the source workspace. Cancelled acquisition cannot publish an installation. Forced termination of the host is outside this shutdown proof.

## Actual results

- `artifacts/ui-design/skill-transport-final-regression.log`: 39 PASS, including actual Git child cancellation, archive extraction, SDK, RPC and backup integration checks.
- `artifacts/ui-design/final-transport-audit-regression.log`: 23 PASS, including catalog integrity, actual process-tree tests and assistant protocol validation. Overlapping checks are not additive acceptance counts.
- `artifacts/ui-design/actual-archive-skill.json`: actual pinned `anthropics/skills` frontend-design bundle installed in approximately 2.8 seconds, two complete files, with manifest bytes independently matching the raw endpoint.
- `artifacts/functional-browser/1794326052495/report.json`: actual external Skill UI import, execution, generated HTML counter interaction, refresh, enable/disable, persistence and uninstall passed. Aggregate run remains **13 PASS / 1 FAIL**: the MCP model emitted DSML tool markup as prose and did not create the required file. The missing file assertion was retained.

The assistant now rejects leading tool-protocol prose without API tool calls, persists a failed receipt and performs no inferred action. The controlled real HTTP regression verifies this failure rather than treating markup as completion. It does not prove that every external model reliably emits valid tool calls.

Final subsequent run `artifacts/functional-browser/1794326749769/report.json` is **14 PASS / 0 FAIL** with real external providers, pinned Skill execution, actual MCP filesystem effect, plugin crash/restart, wheel scrolling and stopped/restarted host reconnect. Both prior 13/14 runs remain failed historical evidence. This passing run is scoped to its fourteen selected workflows, not universal model reliability or product completion.

The current source inventory contains 111 test sources, 93 reviewed additional sources and 617 lexical declarations including containers. Inventory integrity is not test execution or product sign-off. Mobile/cloud prerequisites remain unavailable; the owner permanently withdrew the 24-hour endurance test.
