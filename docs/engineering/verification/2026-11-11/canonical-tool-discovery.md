# Canonical tool discovery and browser routing

The primary assistant's model request and `tools.effective` now use one definition builder. Discovery previously returned a five-item static list, omitted registered tools and advertised `play`/`type_text` as standalone functions even though those names were actions inside `zero_computer_action`. That mismatch could make the UI or assistant report available operations incorrectly.

The actual catalog now exposes the same primary desktop, research, memory, Skill and enabled plugin definitions as the model, including exact media parameters and Spotify controls. Disabled registry entries disappear from both. The response explicitly states `executionVerified=false`: listing a tool does not prove a successful operation, available hardware or external connectivity. Function handlers and provider credentials are not included.

Browser `open` and `search` aliases now dispatch to the supported `open_url` and `web_search` operator actions. The earlier validator accepted the alias but passed an unsupported action name to the operator. Original URL/query arguments are preserved; unknown actions remain refused.

`artifacts/ui-design/tool-discovery-final-regression.log`:6 reported PASS, including a suite container. Actual authenticated WebSocket discovery asserts concrete schema fields and dynamic local registry visibility; a controlled real provider HTTP request independently receives the canonical definitions. Browser alias assertions use a supplied operator and do not establish native browser input or real retrieved search results.

`artifacts/ui-design/tool-discovery-audit-regression.log`:16 metadata/reporter checks PASS. Inventory integrity is NOT_RUN for product acceptance. Current source census is113 files/95 reviewed additional sources/623 lexical declarations including containers; original legacy leaves remain137.

The prior [live media/microphone fixes](live-workflow-repairs.md) retain their separate real execution evidence. Camera hardware remains unavailable and preservation cleanup remains blocked by automatic approval review. No further deletion was attempted through an alternate tool, and no broader production sign-off is implied.
