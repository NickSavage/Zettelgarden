package llms

import (
	"os"
	"testing"
)

func TestChunkInput(t *testing.T) {
	input := "hello world"
	results := chunkInput(input)
	if len(results) != 1 {
		t.Errorf("wrong number of chunks returned, got %v want %v", len(results), 1)
	}
	inputBytes, err := os.ReadFile("../tests/long_text.txt")
	if err != nil {
		t.Errorf("error reading file: %v", err)
	}
	input = string(inputBytes)
	results = chunkInput(input)
	if len(results) != 10 {
		t.Errorf("wrong number of chunks returned, got %v want %v", len(results), 10)
	}

}
