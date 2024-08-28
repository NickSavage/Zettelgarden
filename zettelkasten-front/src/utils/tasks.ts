export function removeTagsFromTitle(title: string): string {
  const tagPattern = /#[\w-]+/g;
  const cleanedTitle = title.replace(tagPattern, '');
  return cleanedTitle.trim();
}
