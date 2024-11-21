package llms

import (
	"log"
	"regexp"
	"strings"
)

func GenerateChunks(input string) []string {
	results := []string{}

	// Only trim leading/trailing spaces
	input = strings.TrimSpace(input)

	// Regular expression to match reference patterns that end in a line break
	refPattern := regexp.MustCompile(`(?m)\[[A-Z]\.\d+\].*$`)

	// Remove the references that end in line breaks
	input = refPattern.ReplaceAllString(input, "")
	log.Printf("input %v", input)

	// Split by periods but add them back
	sentences := strings.Split(input+".", ".")
	for i, sentence := range sentences {
		// Skip the last empty element caused by our added period
		if i == len(sentences)-1 && sentence == "" {
			break
		}

		// Only trim leading spaces, preserve newlines and trailing spaces
		sentence = strings.TrimLeft(sentence, " ")
		log.Printf("sentence '%v'", sentence)
		if sentence == "" || strings.TrimSpace(sentence) == "" {
			continue
		}

		results = append(results, sentence+".")
	}

	return results
}
