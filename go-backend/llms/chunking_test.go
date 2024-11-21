package llms

import (
	"log"
	"testing"
)

func TestChunkCardBody(t *testing.T) {
	input := `Lorem ipsum odor amet, consectetuer adipiscing elit. Luctus egestas lobortis cursus mollis facilisi. Scelerisque vel litora rhoncus porttitor eros. Lacus orci morbi a varius lobortis rutrum interdum per. Nostra commodo phasellus etiam morbi metus porttitor. Mauris a fermentum habitasse sollicitudin semper porta. Fermentum phasellus hendrerit purus, etiam erat litora.

Lorem cubilia cubilia dis iaculis, odio vivamus interdum adipiscing dolor.`

	results := GenerateChunks(input)
	for _, result := range results {
		log.Printf(result)
	}

	if len(results) != 8 {
		t.Errorf("wrong number of chunks returned, got %v want %v", len(results), 8)
	}
	string := "Fermentum phasellus hendrerit purus, etiam erat litora."
	if len(results) > 6 && results[6] != string {
		t.Errorf("wrong chunk return, %v, got %v want %v", results[6] == string, results[6], string)
		t.Errorf("one: %v", results[6])
		t.Errorf("two: %v", string)

	}
	last := "\n\nLorem cubilia cubilia dis iaculis, odio vivamus interdum adipiscing dolor."
	if len(results) > 7 && results[7] != last {
		t.Errorf("wrong chunk return, got %v want %v", results[7], last)

	}
}

func TestChunkCardBodyRemoveBacklinks(t *testing.T) {

	input := `Lorem ipsum odor amet, consectetuer adipiscing elit. Luctus egestas lobortis cursus mollis facilisi. 

[A.1] - Test`
	results := GenerateChunks(input)

	if len(results) != 2 {
		t.Errorf("wrong number of chunks returned, got %v want %v", len(results), 2)
	}
	input = `Lorem ipsum odor amet, consectetuer adipiscing elit. Luctus egestas lobortis cursus mollis facilisi. 

[A.1] - Test

[B.1] - Another test, this one a big longer`
	results = GenerateChunks(input)
	if len(results) != 2 {
		t.Errorf("wrong number of chunks returned, got %v want %v", len(results), 2)
	}

}
