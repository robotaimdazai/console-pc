export function toLocalFileUrl(filePath) {
  if (!filePath) return null;
  const normalized = filePath.replace(/\\/g, '/');
  return `local-file:///${normalized}`;
}
