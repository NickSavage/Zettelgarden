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
      const termWithoutNegation = isNegation ? term.substring(1) : term;
      const lowerTerm = termWithoutNegation.toLowerCase();

      // Priority filtering
      if (lowerTerm.startsWith('priority:')) {
        const priorityValue = lowerTerm.substring('priority:'.length);
        if (task.priority === null) { // Task has no priority
          return isNegation; // If !priority:X and task has no priority, it's a match. If priority:X, it's not.
        }
        const taskPriorityLower = task.priority.toLowerCase();
        const matchesPriority = taskPriorityLower === priorityValue;
        return isNegation ? !matchesPriority : matchesPriority;
      }

      // Tag filtering
      if (lowerTerm.startsWith('#')) {
        const tagName = lowerTerm.substring(1);
        const hasTag = task.tags.some(tag => tag.name.toLowerCase() === tagName);
        return isNegation ? !hasTag : hasTag;
      }

      // Text filtering (title)
      const hasText = task.title.toLowerCase().includes(lowerTerm);
      return isNegation ? !hasText : hasText;
    });
  });
}
