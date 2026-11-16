export function isStaleProbeSessionTitle(title) {
  const value = String(title || '').trim();
  return /^Run hostname and tell me my PC name\.?$/i.test(value)
    || /^Create a file called zero-debug-test\.txt\b/i.test(value);
}
