package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"strings"
	"time"

	readability "github.com/go-shiori/go-readability"
	"golang.org/x/net/html"
)

type Parser struct {
	// Add any dependencies here if needed
}

type ParseResult struct {
	Title    string `json:"title"`
	Content  string `json:"content"`
	URL      string `json:"url,omitempty"`
	Author   string `json:"author,omitempty"`
	Excerpt  string `json:"excerpt,omitempty"`
	SiteName string `json:"site_name,omitempty"`
	// Add any other fields you want to return
}

func (p *Parser) ParseHTML(htmlContent string, urlStr string) (ParseResult, error) {
	if strings.TrimSpace(htmlContent) == "" {
		return ParseResult{}, errors.New("empty HTML provided")
	}

	// Parse the HTML string into html.Node
	doc, err := html.Parse(strings.NewReader(htmlContent))
	if err != nil {
		return ParseResult{}, err
	}

	// Parse the URL
	pageURL, err := url.Parse(urlStr)
	if err != nil {
		return ParseResult{}, err
	}

	// Create parser and parse the document
	parser := readability.NewParser()
	article, err := parser.ParseDocument(doc, pageURL)
	if err != nil {
		return ParseResult{}, err
	}

	result := ParseResult{
		Title:    article.Title,
		Content:  article.Content,
		URL:      urlStr,
		Author:   article.Byline,
		Excerpt:  article.Excerpt,
		SiteName: article.SiteName,
	}

	return result, nil
}

type ParseURLRequest struct {
	URL string `json:"url"`
}

func (h *Handler) ParseURLRoute(w http.ResponseWriter, r *http.Request) {
	var req ParseURLRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Basic validation
	if req.URL == "" {
		http.Error(w, "url is required", http.StatusBadRequest)
		return
	}

	// Parse the URL using readability
	article, err := readability.FromURL(req.URL, 30*time.Second) // adjust timeout as needed
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Convert to your response format if needed
	result := ParseResult{
		Title:    article.Title,
		Content:  article.Content,
		URL:      req.URL,
		Author:   article.Byline,
		Excerpt:  article.Excerpt,
		SiteName: article.SiteName,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}
