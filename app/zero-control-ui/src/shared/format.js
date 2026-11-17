/** Display formatting helpers. */

function formatBytes(bytes) {
  if (bytes === null || bytes === undefined || isNaN(bytes)) return "-";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}


function formatWhen(stamp) {
  if (typeof stamp !== "number") return "Time unknown";
  const value = new Date(stamp);
  const now = Date.now();
  const sameDay = value.toDateString() === new Date(now).toDateString();
  return sameDay
    ? value.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : value.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}


export { formatBytes, formatWhen };
