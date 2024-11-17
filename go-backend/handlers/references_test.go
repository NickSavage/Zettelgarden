package handlers

import (
	"strings"
	"testing"
)

func TestParser_ParseHTML(t *testing.T) {
	tests := []struct {
		name    string
		html    string
		url     string
		want    ParseResult
		wantErr bool
	}{
		{
			name: "successfully parse valid HTML",
			html: `
                <html>
                    <head><title>Test Title</title></head>
                    <body><article><p>Test content</p></article></body>
                </html>`,
			url: "https://example.com/article",
			want: ParseResult{
				Title:   "Test Title",
				Content: "Test content",
				URL:     "https://example.com/article",
			},
			wantErr: false,
		},
		{
			name:    "should return error for empty HTML",
			html:    "",
			url:     "https://example.com",
			want:    ParseResult{},
			wantErr: true,
		},
		// {
		// 	name:    "should handle invalid URL",
		// 	html:    `<html><body>Content</body></html>`,
		// 	url:     "not-a-url",
		// 	want:    ParseResult{},
		// 	wantErr: true,
		// },
		{
			name: "should handle HTML without article tags",
			html: `
                <html>
                    <head><title>No Article</title></head>
                    <body><div>Simple content</div></body>
                </html>`,
			url: "https://example.com",
			want: ParseResult{
				Title:   "No Article",
				Content: "Simple content",
				URL:     "https://example.com",
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			p := &Parser{}
			got, err := p.ParseHTML(tt.html, tt.url)

			if (err != nil) != tt.wantErr {
				t.Errorf("ParseHTML() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if !tt.wantErr {
				if got.Title != tt.want.Title {
					t.Errorf("ParseHTML() title = %v, want %v", got.Title, tt.want.Title)
				}
				if !strings.Contains(got.Content, tt.want.Content) {
					t.Errorf("ParseHTML() content = %v, want %v", got.Content, tt.want.Content)
				}
				if got.URL != tt.want.URL {
					t.Errorf("ParseHTML() url = %v, want %v", got.URL, tt.want.URL)
				}
			}
		})
	}
}
