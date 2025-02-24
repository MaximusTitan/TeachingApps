export function getCurrentUrlExtension(url: string): string {
    const urlParts = new URL(url).pathname.split("/").filter(Boolean); // Remove empty parts
    return urlParts.pop() || ""; // Return the last part or an empty string if none
}
  