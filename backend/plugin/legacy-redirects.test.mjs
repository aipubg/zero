import assert from "node:assert/strict";
import test from "node:test";
import { LEGACY_REDIRECTS, registerLegacyChatRedirects } from "./index.js";

function mockResponse() {
  return {
    statusCode: 0,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end() {
      this.ended = true;
    },
  };
}

test("legacy worker settings and new-chat routes redirect without a chat surface", () => {
  const routes = [];
  const registered = registerLegacyChatRedirects({
    registerHttpRoute: (route) => routes.push(route),
    logger: { warn() {} },
  });
  assert.equal(registered, LEGACY_REDIRECTS.length + 1);
  assert.deepEqual(
    routes.map((route) => route.path),
    ["/settings/agents/operator", "/settings/agents/researcher", "/new"],
  );

  for (const route of routes) {
    assert.equal(route.auth, "gateway", `${route.path} must use the host auth level`);
  }

  for (const route of routes.slice(0, 2)) {
    const res = mockResponse();
    assert.equal(route.handler({ url: route.path }, res), true);
    assert.equal(res.statusCode, 308);
    assert.equal(res.headers.Location, "/agents");
    assert.equal(res.ended, true);
  }

  const newRoute = routes.at(-1);
  for (const agent of ["operator", "researcher", "OPERATOR"]) {
    const res = mockResponse();
    assert.equal(newRoute.handler({ url: `/new?agent=${agent}` }, res), true);
    assert.equal(res.headers.Location, "/chat/zero");
  }
  const zeroRes = mockResponse();
  assert.equal(newRoute.handler({ url: "/new?agent=zero" }, zeroRes), false);
  assert.equal(zeroRes.statusCode, 0);
  assert.equal(zeroRes.ended, undefined);
});
