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
  const searchTerms = filterString.split(' ').map(term => term.trim());

  return input.filter(task => {
    console.log(task.title)
    return searchTerms.every(term => {
      if (term.startsWith('#')) {
	console.log(term)
        // Check if any of the tag names match the term
        const tagName = term.substring(1).toLowerCase();
	console.log(tagName)
        return task.tags.some(tag => tag.name.toLowerCase() === tagName);
      } else {
        // Check if the title matches the term
        return task.title.toLowerCase().includes(term.toLowerCase());
      }
    });
  });

  return input;
}
