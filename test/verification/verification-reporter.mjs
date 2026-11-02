// Node test-runner event protocol. Omit logs, payloads, stack traces and credentials.
export default async function* reporter(events) {
  for await (const event of events) {
    if (!['test:pass', 'test:fail'].includes(event.type)) continue;
    const data = event.data;
    yield JSON.stringify({ type: event.type, data: {
      name: data.name, nesting: data.nesting,
      skip: data.skip, todo: data.todo,
      failureType: data.details?.error?.failureType,
      durationMs: data.details?.duration_ms,
    } }) + '\n';
  }
}
