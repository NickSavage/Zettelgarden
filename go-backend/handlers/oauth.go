package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"

	"go-backend/models"
)

type GitHubAccessTokenResponse struct {
	AccessToken string `json:"access_token"`
	Scope       string `json:"scope"`
	TokenType   string `json:"token_type"`
}

type GitHubUser struct {
	ID    int    `json:"id"`
	Login string `json:"login"`
	Email string `json:"email"`
}

func (s *Handler) StartGitHubOAuthRoute(w http.ResponseWriter, r *http.Request) {
	clientID := os.Getenv("GITHUB_CLIENT_ID")
	redirectURI := os.Getenv("GITHUB_REDIRECT_URI")
	scope := "user:email"

	githubAuthURL := fmt.Sprintf(
		"https://github.com/login/oauth/authorize?client_id=%s&redirect_uri=%s&scope=%s",
		clientID, url.QueryEscape(redirectURI), scope,
	)

	http.Redirect(w, r, githubAuthURL, http.StatusFound)
}

func (s *Handler) GitHubCallbackRoute(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "Missing code", http.StatusBadRequest)
		return
	}

	clientID := os.Getenv("GITHUB_CLIENT_ID")
	clientSecret := os.Getenv("GITHUB_CLIENT_SECRET")
	redirectURI := os.Getenv("GITHUB_REDIRECT_URI")

	body := url.Values{}
	body.Set("client_id", clientID)
	body.Set("client_secret", clientSecret)
	body.Set("code", code)
	body.Set("redirect_uri", redirectURI)

	tokenReq, _ := http.NewRequest("POST", "https://github.com/login/oauth/access_token", strings.NewReader(body.Encode()))
	tokenReq.Header.Set("Accept", "application/json")
	tokenReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := http.DefaultClient.Do(tokenReq)
	if err != nil {
		http.Error(w, "Error exchanging code", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	var tokenRes GitHubAccessTokenResponse
	json.NewDecoder(resp.Body).Decode(&tokenRes)

	if tokenRes.AccessToken == "" {
		http.Error(w, "Token exchange failed", http.StatusUnauthorized)
		return
	}

	// GitHub user info
	userReq, _ := http.NewRequest("GET", "https://api.github.com/user", nil)
	userReq.Header.Set("Authorization", "Bearer "+tokenRes.AccessToken)
	userRes, _ := http.DefaultClient.Do(userReq)
	defer userRes.Body.Close()

	var ghUser GitHubUser
	json.NewDecoder(userRes.Body).Decode(&ghUser)

	// Fetch emails for verified ones
	emailReq, _ := http.NewRequest("GET", "https://api.github.com/user/emails", nil)
	emailReq.Header.Set("Authorization", "Bearer "+tokenRes.AccessToken)
	emailRes, _ := http.DefaultClient.Do(emailReq)
	defer emailRes.Body.Close()

	var emails []struct {
		Email    string `json:"email"`
		Primary  bool   `json:"primary"`
		Verified bool   `json:"verified"`
	}
	json.NewDecoder(emailRes.Body).Decode(&emails)

	if ghUser.Email == "" {
		for _, e := range emails {
			if e.Primary && e.Verified {
				ghUser.Email = e.Email
				break
			}
		}
	}

	if ghUser.Email == "" {
		http.Error(w, "Could not retrieve email", http.StatusUnauthorized)
		return
	}

	// Find or create user
	user, err := s.QueryUserByEmail(ghUser.Email)
	if err != nil || user.ID == 0 {
		// no matching user, create new
		params := models.CreateUserParams{
			Username: ghUser.Login,
			Email:    ghUser.Email,
			Password: "github_oauth_" + fmt.Sprint(ghUser.ID),
		}
		newID, err := s.CreateUser(params)
		if err != nil {
			http.Error(w, "User creation failed", http.StatusInternalServerError)
			return
		}

		_, err = s.DB.Exec(`UPDATE users SET auth_provider = 'github', github_id = $1 WHERE id = $2`, ghUser.ID, newID)
		if err != nil {
			http.Error(w, "Failed to update auth provider info", http.StatusInternalServerError)
			return
		}
		user, _ = s.QueryUser(newID)
	} else {
		// existing user found by email, update with GitHub metadata
		_, err = s.DB.Exec(`UPDATE users SET auth_provider = 'github', github_id = $1 WHERE id = $2 AND (auth_provider = 'local' OR github_id IS NULL)`, ghUser.ID, user.ID)
		if err != nil {
			http.Error(w, "Failed to link GitHub account", http.StatusInternalServerError)
			return
		}
	}

	// Generate JWT
	token, err := s.generateAccessToken(user.ID)
	if err != nil {
		http.Error(w, "JWT generation failed", http.StatusInternalServerError)
		return
	}

	// Redirect back to frontend with token
	frontendURL := os.Getenv("FRONTEND_URL")
	redirect := fmt.Sprintf("%s/login?token=%s", frontendURL, token)
	http.Redirect(w, r, redirect, http.StatusFound)
}
