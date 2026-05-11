export function formatDate(date?: string | Date | null) {
  if (!date) return null;

  return new Date(date).toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    dateStyle: "medium",
    timeStyle: "short",
  });
}
