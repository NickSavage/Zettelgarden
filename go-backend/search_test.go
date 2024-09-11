package main

import (
	"testing"
)

func TestParseSearchText(t *testing.T) {
	var output SearchParams
	input := "hello #test"
	output = ParseSearchText(input)

	if len(output.Terms) != 1 {
		t.Errorf("wrong number of search terms returned, got %v want %v", len(output.Terms), 0)
	}
	if output.Terms[0] != "hello" {
		t.Errorf("wrong term returned, got %v want %v", output.Terms[0], "hello")
	}
	if len(output.Tags) != 1 {
		t.Errorf("wrong number of search tags returned, got %v want %v", len(output.Tags), 0)
	}
	if output.Tags[0] != "test" {
		t.Errorf("wrong tag returned, got %v want %v", output.Tags[0], "test")
	}

	input = "hello #test world #another"
	output = ParseSearchText(input)

	if len(output.Terms) != 2 {
		t.Errorf("wrong number of search terms returned, got %v want %v", len(output.Terms), 0)
	}
	if output.Terms[0] != "hello" {
		t.Errorf("wrong term returned, got %v want %v", output.Terms[0], "hello")
	}
	if output.Terms[1] != "world" {
		t.Errorf("wrong term returned, got %v want %v", output.Terms[1], "world")
	}
	if len(output.Tags) != 2 {
		t.Errorf("wrong number of search tags returned, got %v want %v", len(output.Tags), 0)
	}
	if output.Tags[0] != "test" {
		t.Errorf("wrong tag returned, got %v want %v", output.Tags[0], "test")
	}
	if output.Tags[1] != "another" {
		t.Errorf("wrong tag returned, got %v want %v", output.Tags[1], "another")
	}
}
