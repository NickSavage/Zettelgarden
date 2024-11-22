package llms

import (
	"log"
	"strings"
	"testing"
)

func TestChunkCardBody(t *testing.T) {
	input := `Lorem ipsum odor amet, consectetuer adipiscing elit. Luctus egestas lobortis cursus mollis facilisi. Scelerisque vel litora rhoncus porttitor eros. Lacus orci morbi a varius lobortis rutrum interdum per. Nostra commodo phasellus etiam morbi metus porttitor. Mauris a fermentum habitasse sollicitudin semper porta. Fermentum phasellus hendrerit purus, etiam erat litora.

Lorem cubilia cubilia dis iaculis, odio vivamus interdum adipiscing dolor.`

	results := GenerateChunks(input)
	for _, result := range results {
		log.Printf(result)
	}

	if len(results) != 2 {
		t.Errorf("wrong number of chunks returned, got %v want %v", len(results), 2)
	}
	string := `Fermentum phasellus hendrerit purus, etiam erat litora

Lorem cubilia cubilia dis iaculis, odio vivamus interdum adipiscing dolor.`

	if len(results) > 1 && results[1] != string {
		t.Errorf("wrong chunk return, %v, got %v want %v", results[1] == string, results[1], string)

	}
}
func TestChunkCardMultiChunkLength(t *testing.T) {
	input := `012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789.`
	input += input
	input += input
	if len(input) != 1204 {
		t.Errorf("wrong length of input, got %v want %v", len(input), 1204)
	}
	results := GenerateChunks(input)
	if len(results) != 4 {
		t.Errorf("wrong number of chunks returned, got %v want %v", len(results), 4)
	}
	input += "hello world"
	results = GenerateChunks(input)
	if len(results) != 5 {
		t.Errorf("wrong number of chunks returned, got %v want %v", len(results), 5)
	}
}

func TestChunkCardBodyRemoveBacklinks(t *testing.T) {

	input := `Lorem ipsum odor amet, consectetuer adipiscing elit. Luctus egestas lobortis cursus mollis facilisi. 

[A.1] - Test`
	results := GenerateChunks(input)
	if strings.Contains(results[0], "[A.1]") {
		t.Errorf("string still contains reference %v", "[A.1]")
	}
	if strings.Contains(results[0], "Test") {
		t.Errorf("string still contains reference %v", "bit longer")
	}

	if len(results) != 1 {
		t.Errorf("wrong number of chunks returned, got %v want %v", len(results), 2)
	}
	input = `Lorem ipsum odor amet, consectetuer adipiscing elit. Luctus egestas lobortis cursus mollis facilisi. 

[A.1] - Test

[B.1] - Another test, this one a bit longer`
	results = GenerateChunks(input)
	if len(results) != 1 {
		t.Errorf("wrong number of chunks returned, got %v want %v", len(results), 2)
	}
	if strings.Contains(results[0], "[B.1]") {
		t.Errorf("string still contains reference %v", "[B.1]")
	}
	if strings.Contains(results[0], "but longer") {
		t.Errorf("string still contains reference %v", "bit longer")
	}

}
