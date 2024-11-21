package llms

import (
	"strings"
)

func GenerateChunks(input string) []string {
	results := []string{}

	// Only trim leading/trailing spaces
	input = strings.TrimSpace(input)

	// Split by periods but add them back
	sentences := strings.Split(input+".", ".")
	for i, sentence := range sentences {
		// Skip the last empty element caused by our added period
		if i == len(sentences)-1 && sentence == "" {
			break
		}

		// Only trim leading spaces, preserve newlines and trailing spaces
		sentence = strings.TrimLeft(sentence, " ")
		if sentence == "" {
			continue
		}

		results = append(results, sentence+".")
	}

	return results
}
