/** Safe, user-actionable Gateway/RPC error helpers. */

function readableError(error) {
  return error instanceof Error ? error.message : String(error ?? "Unknown error");
}

/**
 * Completed `zero.providers.test` calls return `ok: true` with a provider
 * status and a sanitized `message`; RPC/setup failures use `error.message`.
 */

function testFailureDetail(result) {
  return (
    (typeof result?.message === "string" && result.message.trim()) ||
    (typeof result?.error?.message === "string" && result.error.message.trim()) ||
    (typeof result?.error === "string" && result.error.trim()) ||
    ""
  );
}


function isMissingMethod(error) {
  return /unknown method|method not found|not advertised|unsupported method|no such method/i.test(
    readableError(error),
  );
}


export { readableError, testFailureDetail, isMissingMethod };
