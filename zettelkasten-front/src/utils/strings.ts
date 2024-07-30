 export function findWordBoundaries(input: string, index: number): { start: number, end: number } {
    if (index < 0 || index >= input.length) {
        throw new Error("Index is out of bounds");
    }

    // Find the start of the word
    let start = index;
    while (start > 0 && input[start - 1] !== ' ' && input[start - 1] !== '\n') {
        console.log(input[start - 1])
        start--;
    }

    // Find the end of the word
    let end = index;
    while (end < input.length - 1 && input[end] != ' ' && input[end] !== '\n') {
        end++;
    }

    return { start, end: end + 1 }; // Adjust end to be inclusive
}
