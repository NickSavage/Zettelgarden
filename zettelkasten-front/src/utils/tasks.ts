export function removeTagsFromTitle(title: string): string {
  const tagPattern = /#[\w-]+/g;
  const cleanedTitle = title.replace(tagPattern, "");
  return cleanedTitle.trim();
}

export function parseTags(title: string): string[] {
  const tagPattern = /#[\w-]+/g;
  const matches = title.match(tagPattern);

  return matches ? Array.from(matches) : [];
}
