import { Task } from "../models/Task";

export function removeTagsFromTitle(title: string): string {
  const tagPattern = /#[\w-]+/g;
  const cleanedTitle = title.replace(tagPattern, "");
  return cleanedTitle.trim();
}

export function parseTags(title: string): string[] {
  const tagPattern = /(?<=\s|^)(#[\w-]+(?:[.,!?])?)+(?=\s|$)/g;
  const matches = title.match(tagPattern);

  return matches ? Array.from(matches) : [];
}

export function filterTasks(input: Task[], filterString: string): Task[] {
  const searchTerms = filterString.split(' ').map(term => term.trim()).filter(term => term !== '');

  return input.filter(task => {
    return searchTerms.every(term => {
      const isNegation = term.startsWith('!');
      const actualTerm = isNegation ? term.substring(1) : term;

      if (actualTerm.startsWith('#')) {
        // Check if any of the tag names match the term
        const tagName = actualTerm.substring(1).toLowerCase();
        const hasTag = task.tags.some(tag => tag.name.toLowerCase() === tagName);
        return isNegation ? !hasTag : hasTag;
      } else {
        // Check if the title matches the term
        const hasText = task.title.toLowerCase().includes(actualTerm.toLowerCase());
        return isNegation ? !hasText : hasText;
      }
    });
  });
}
