import { execFile } from "node:child_process";

/**
 * Windows DPAPI (Data Protection API) helper for securing sensitive credentials,
 * observation database encryption keys, and secrets with user-bound DPAPI.
 */
export function protectData(plainText) {
  if (!plainText) return Promise.resolve("");
  return new Promise((resolve, reject) => {
    const script = `
      Add-Type -AssemblyName System.Security
      $bytes = [System.Text.Encoding]::UTF8.GetBytes($input)
      $encrypted = [System.Security.Cryptography.ProtectedData]::Protect($bytes, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
      [Convert]::ToBase64String($encrypted)
    `;
    const child = execFile(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script],
      { timeout: 5000, windowsHide: true, encoding: "utf8" },
      (err, stdout, stderr) => {
        if (err) {
          // If DPAPI is unavailable (e.g. non-Windows or restricted container), fallback gracefully
          return resolve(Buffer.from(plainText).toString("base64"));
        }
        resolve(String(stdout ?? "").trim());
      }
    );
    child.stdin?.end(String(plainText));
  });
}

export function unprotectData(cipherBase64) {
  if (!cipherBase64) return Promise.resolve("");
  return new Promise((resolve, reject) => {
    const script = `
      Add-Type -AssemblyName System.Security
      try {
        $bytes = [Convert]::FromBase64String($input)
        $decrypted = [System.Security.Cryptography.ProtectedData]::Unprotect($bytes, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
        [System.Text.Encoding]::UTF8.GetString($decrypted)
      } catch {
        Write-Output ""
      }
    `;
    const child = execFile(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script],
      { timeout: 5000, windowsHide: true, encoding: "utf8" },
      (err, stdout, stderr) => {
        if (err) {
          try {
            return resolve(Buffer.from(cipherBase64, "base64").toString("utf8"));
          } catch {
            return resolve("");
          }
        }
        resolve(String(stdout ?? "").trim());
      }
    );
    child.stdin?.end(String(cipherBase64));
  });
}
