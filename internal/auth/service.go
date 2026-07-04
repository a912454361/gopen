package auth

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
	"golang.org/x/oauth2/google"
)

var (
	ErrUserNotFound    = errors.New("user not found")
	ErrInvalidPassword = errors.New("invalid password")
	ErrUserExists      = errors.New("user already exists")
	ErrInvalidToken    = errors.New("invalid token")
)

type Service struct {
	db         *sql.DB
	jwtSecret  []byte
	jwtExpire  time.Duration
	bcryptCost int

	githubConfig *oauth2.Config
	googleConfig *oauth2.Config
}

type User struct {
	ID         int64  `json:"id"`
	Username   string `json:"username"`
	Email      string `json:"email"`
	Password   string `json:"-"`
	Provider   string `json:"provider"`
	ProviderID string `json:"provider_id,omitempty"`
	Avatar     string `json:"avatar,omitempty"`
	IsActive   bool   `json:"is_active"`
	CreatedAt  string `json:"created_at"`
}

type Claims struct {
	UserID   int64  `json:"user_id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	jwt.RegisteredClaims
}

func NewService(db *sql.DB) *Service {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "default-secret-change-in-production"
	}

	expireHours, _ := strconv.Atoi(os.Getenv("JWT_EXPIRE_HOURS"))
	if expireHours == 0 {
		expireHours = 24
	}

	bcryptCost, _ := strconv.Atoi(os.Getenv("BCRYPT_COST"))
	if bcryptCost == 0 {
		bcryptCost = 12
	}

	redirectURL := os.Getenv("OAUTH_REDIRECT_URL")
	if redirectURL == "" {
		redirectURL = "http://localhost:8080/auth/callback"
	}

	return &Service{
		db:         db,
		jwtSecret:  []byte(jwtSecret),
		jwtExpire:  time.Duration(expireHours) * time.Hour,
		bcryptCost: bcryptCost,
		githubConfig: &oauth2.Config{
			ClientID:     os.Getenv("GITHUB_CLIENT_ID"),
			ClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
			Endpoint:     github.Endpoint,
			RedirectURL:  redirectURL + "/github",
			Scopes:       []string{"read:user", "user:email"},
		},
		googleConfig: &oauth2.Config{
			ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
			ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
			Endpoint:     google.Endpoint,
			RedirectURL:  redirectURL + "/google",
			Scopes:       []string{"openid", "email", "profile"},
		},
	}
}

func (s *Service) HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), s.bcryptCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

func (s *Service) VerifyPassword(hashedPassword, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}

func (s *Service) GenerateToken(user *User) (string, error) {
	claims := Claims{
		UserID:   user.ID,
		Username: user.Username,
		Email:    user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.jwtExpire)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(s.jwtSecret)
}

func (s *Service) ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return s.jwtSecret, nil
	})

	if err != nil {
		return nil, ErrInvalidToken
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, ErrInvalidToken
}

func (s *Service) Register(username, email, password string) (*User, error) {
	var existingID int64
	err := s.db.QueryRow("SELECT id FROM users WHERE username = ? OR email = ?", username, email).Scan(&existingID)
	if err == nil {
		return nil, ErrUserExists
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}

	hashedPassword, err := s.HashPassword(password)
	if err != nil {
		return nil, err
	}

	result, err := s.db.Exec("INSERT INTO users (username, email, password, provider) VALUES (?, ?, ?, 'local')",
		username, email, hashedPassword)
	if err != nil {
		return nil, err
	}

	id, _ := result.LastInsertId()

	return &User{
		ID:        id,
		Username:  username,
		Email:     email,
		Provider:  "local",
		IsActive:  true,
		CreatedAt: time.Now().Format("2006-01-02 15:04:05"),
	}, nil
}

func (s *Service) Login(usernameOrEmail, password string) (*User, error) {
	var user User

	var avatar sql.NullString
	err := s.db.QueryRow("SELECT id, username, email, password, provider, avatar, is_active, created_at FROM users WHERE username = ? OR email = ?",
		usernameOrEmail, usernameOrEmail).
		Scan(&user.ID, &user.Username, &user.Email, &user.Password, &user.Provider, &avatar, &user.IsActive, &user.CreatedAt)
	user.Avatar = avatar.String

	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}

	if user.Provider != "local" {
		return nil, errors.New("please use " + user.Provider + " to login")
	}

	if err := s.VerifyPassword(user.Password, password); err != nil {
		return nil, ErrInvalidPassword
	}

	return &user, nil
}

func (s *Service) GetUserByID(userID int64) (*User, error) {
	var user User

	err := s.db.QueryRow("SELECT id, username, email, provider, avatar, is_active, created_at FROM users WHERE id = ?", userID).
		Scan(&user.ID, &user.Username, &user.Email, &user.Provider, &user.Avatar, &user.IsActive, &user.CreatedAt)

	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrUserNotFound
	}
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (s *Service) GenerateState() string {
	b := make([]byte, 32)
	rand.Read(b)
	return base64.URLEncoding.EncodeToString(b)
}

func (s *Service) GetGitHubAuthURL(state string) string {
	return s.githubConfig.AuthCodeURL(state)
}

func (s *Service) GetGoogleAuthURL(state string) string {
	return s.googleConfig.AuthCodeURL(state)
}

func (s *Service) HandleGitHubCallback(code string) (*User, error) {
	token, err := s.githubConfig.Exchange(context.Background(), code)
	if err != nil {
		return nil, err
	}

	client := &http.Client{}
	req, _ := http.NewRequest("GET", "https://api.github.com/user", nil)
	req.Header.Set("Authorization", "Bearer "+token.AccessToken)

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var githubUser struct {
		ID        int64  `json:"id"`
		Login     string `json:"login"`
		Email     string `json:"email"`
		AvatarURL string `json:"avatar_url"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&githubUser); err != nil {
		return nil, err
	}

	var user User
	providerID := fmt.Sprintf("%d", githubUser.ID)
	err = s.db.QueryRow("SELECT id, username, email, provider, avatar, is_active, created_at FROM users WHERE provider = 'github' AND provider_id = ?",
		providerID).
		Scan(&user.ID, &user.Username, &user.Email, &user.Provider, &user.Avatar, &user.IsActive, &user.CreatedAt)

	if errors.Is(err, sql.ErrNoRows) {
		email := githubUser.Email
		if email == "" {
			email = fmt.Sprintf("%s@github.com", githubUser.Login)
		}

		result, err := s.db.Exec("INSERT INTO users (username, email, provider, provider_id, avatar) VALUES (?, ?, 'github', ?, ?)",
			githubUser.Login, email, providerID, githubUser.AvatarURL)
		if err != nil {
			return nil, err
		}

		id, _ := result.LastInsertId()
		return &User{
			ID:         id,
			Username:   githubUser.Login,
			Email:      email,
			Provider:   "github",
			ProviderID: providerID,
			Avatar:     githubUser.AvatarURL,
			IsActive:   true,
			CreatedAt:  time.Now().Format("2006-01-02 15:04:05"),
		}, nil
	}

	return &user, err
}

func (s *Service) HandleGoogleCallback(code string) (*User, error) {
	token, err := s.googleConfig.Exchange(context.Background(), code)
	if err != nil {
		return nil, err
	}

	client := &http.Client{}
	req, _ := http.NewRequest("GET", "https://www.googleapis.com/oauth2/v2/userinfo", nil)
	req.Header.Set("Authorization", "Bearer "+token.AccessToken)

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var googleUser struct {
		ID      string `json:"id"`
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&googleUser); err != nil {
		return nil, err
	}

	var user User
	err = s.db.QueryRow("SELECT id, username, email, provider, avatar, is_active, created_at FROM users WHERE provider = 'google' AND provider_id = ?",
		googleUser.ID).
		Scan(&user.ID, &user.Username, &user.Email, &user.Provider, &user.Avatar, &user.IsActive, &user.CreatedAt)

	if errors.Is(err, sql.ErrNoRows) {
		username := googleUser.Name
		if username == "" {
			idx := strings.Index(googleUser.Email, "@")
			if idx > 0 {
				username = googleUser.Email[:idx]
			} else {
				username = googleUser.Email
			}
		}

		result, err := s.db.Exec("INSERT INTO users (username, email, provider, provider_id, avatar) VALUES (?, ?, 'google', ?, ?)",
			username, googleUser.Email, googleUser.ID, googleUser.Picture)
		if err != nil {
			return nil, err
		}

		id, _ := result.LastInsertId()
		return &User{
			ID:         id,
			Username:   username,
			Email:      googleUser.Email,
			Provider:   "google",
			ProviderID: googleUser.ID,
			Avatar:     googleUser.Picture,
			IsActive:   true,
			CreatedAt:  time.Now().Format("2006-01-02 15:04:05"),
		}, nil
	}

	return &user, err
}
