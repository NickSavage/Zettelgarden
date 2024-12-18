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
	expectedOutput := " AND ((card_id ILIKE '%hello%' OR title ILIKE '%hello%') AND (card_id ILIKE '%world%' OR title ILIKE '%world%'))"
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

func TestBuildPartialCardSqlSearchTermStringWithEntities(t *testing.T) {
	testCases := []struct {
		name     string
		input    string
		fullText bool
		contains []string // Strings that should be present in the output
	}{
		{
			name:     "single entity",
			input:    "@[John Smith]",
			fullText: false,
			contains: []string{
				"EXISTS(SELECT1FROMentity_card_junctionecj",
				"JOINentitieseONecj.entity_id=e.id",
				"WHEREecj.card_pk=cards.idANDe.name='JohnSmith'",
			},
		},
		{
			name:     "negated entity",
			input:    "!@[Project Alpha]",
			fullText: false,
			contains: []string{
				"NOTEXISTS(SELECT1FROMentity_card_junctionecj",
				"JOINentitieseONecj.entity_id=e.id",
				"WHEREecj.card_pk=cards.idANDe.name='ProjectAlpha'",
			},
		},
		{
			name:     "mixed entities and terms",
			input:    "hello @[John Smith] !@[Project Beta]",
			fullText: false,
			contains: []string{
				"card_idILIKE'%hello%'ORtitleILIKE'%hello%'",
				"EXISTS(SELECT1FROMentity_card_junctionecj",
				"WHEREecj.card_pk=cards.idANDe.name='JohnSmith'",
				"NOTEXISTS(SELECT1FROMentity_card_junctionecj",
				"WHEREecj.card_pk=cards.idANDe.name='ProjectBeta'",
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := BuildPartialCardSqlSearchTermString(tc.input, tc.fullText)

			// Normalize the result by removing all whitespace
			normalizedResult := strings.ReplaceAll(result, " ", "")
			normalizedResult = strings.ReplaceAll(normalizedResult, "\n", "")
			normalizedResult = strings.ReplaceAll(normalizedResult, "\t", "")
			t.Logf("Normalized SQL: %s", normalizedResult)

			// Check that all expected strings are present in the result
			for _, str := range tc.contains {
				if !strings.Contains(normalizedResult, str) {
					t.Errorf("Expected SQL to contain '%s', but it didn't.\nGot: %s", str, result)
				}
			}
		})
	}
}
