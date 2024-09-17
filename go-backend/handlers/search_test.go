package handlers

import (
	"strings"
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

func TestBuildPartialCardSqlSearchTermString(t *testing.T) {
	input := "hello world"
	expectedOutput := " AND ((card_id ILIKE '%hello%' OR title ILIKE '%hello%') OR (card_id ILIKE '%world%' OR title ILIKE '%world%'))"
	output := BuildPartialCardSqlSearchTermString(input, false)
	if output != expectedOutput {
		t.Errorf("wrong string returned, got %v want %v", output, expectedOutput)
	}

	input = "hello #world"
	expectedOutput = `
	AND (EXISTS (
	            SELECT 1 FROM card_tags
	            JOIN tags ON card_tags.tag_id = tags.id
	            WHERE card_tags.card_pk = cards.id AND tags.name = 'world' AND tags.is_deleted = FALSE
	        )) AND ((card_id ILIKE '%hello%' OR title ILIKE '%hello%'))
			`
	expectedOutput = strings.ReplaceAll(expectedOutput, " ", "")
	expectedOutput = strings.ReplaceAll(expectedOutput, "\n", "")
	expectedOutput = strings.ReplaceAll(expectedOutput, "\t", "")
	output = BuildPartialCardSqlSearchTermString(input, false)
	output = strings.ReplaceAll(output, " ", "")
	output = strings.ReplaceAll(output, "\n", "")
	if output != expectedOutput {
		t.Errorf("wrong string returned, got %v want %v", output, expectedOutput)
	}

}

func TestBuildPartialCardSqlSearchTermStringNegate(t *testing.T) {

	input := "hello !world"
	expectedOutput := " AND ((card_id ILIKE '%hello%' OR title ILIKE '%hello%')) AND (NOT (card_id ILIKE '%world%' OR title ILIKE '%world%'))"
	output := BuildPartialCardSqlSearchTermString(input, false)
	if output != expectedOutput {
		t.Errorf("wrong string returned, got %v want %v", output, expectedOutput)
	}

	input = "hello !#world"
	expectedOutput = `
AND ((card_id ILIKE '%hello%' OR title ILIKE '%hello%')) AND (NOT EXISTS (
            SELECT 1 FROM card_tags
            JOIN tags ON card_tags.tag_id = tags.id
            WHERE card_tags.card_pk = cards.id AND tags.name = 'world' AND tags.is_deleted = FALSE
        ))
`
	expectedOutput = strings.ReplaceAll(expectedOutput, " ", "")
	expectedOutput = strings.ReplaceAll(expectedOutput, "\n", "")
	expectedOutput = strings.ReplaceAll(expectedOutput, "\t", "")
	output = BuildPartialCardSqlSearchTermString(input, false)
	output = strings.ReplaceAll(output, " ", "")
	output = strings.ReplaceAll(output, "\n", "")
	if output != expectedOutput {
		t.Errorf("wrong string returned, got %v want %v", output, expectedOutput)
	}
}
