package utils

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

const cookieName = "selwa_sess"

func sessionSecret() []byte {
	s := os.Getenv("SESSION_SECRET")
	if s == "" {
		s = "selwa-dev-secret-change-in-production"
	}
	return []byte(s)
}

func signToken(userID int64) string {
	payload := strconv.FormatInt(userID, 10)
	mac := hmac.New(sha256.New, sessionSecret())
	mac.Write([]byte(payload))
	sig := hex.EncodeToString(mac.Sum(nil))
	return payload + "." + sig
}

func verifyToken(token string) (int64, bool) {
	parts := strings.SplitN(token, ".", 2)
	if len(parts) != 2 {
		return 0, false
	}
	mac := hmac.New(sha256.New, sessionSecret())
	mac.Write([]byte(parts[0]))
	expected := hex.EncodeToString(mac.Sum(nil))
	if !hmac.Equal([]byte(parts[1]), []byte(expected)) {
		return 0, false
	}
	id, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil {
		return 0, false
	}
	return id, true
}

func isSecure(r *http.Request) bool {
	if r.TLS != nil {
		return true
	}
	if r.Header.Get("X-Forwarded-Proto") == "https" {
		return true
	}
	return os.Getenv("COOKIE_SECURE") == "true"
}

func SetSessionCookie(w http.ResponseWriter, r *http.Request, userID int64) {
	http.SetCookie(w, &http.Cookie{
		Name:     cookieName,
		Value:    signToken(userID),
		Path:     "/",
		HttpOnly: true,
		Secure:   isSecure(r),
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(30 * 24 * time.Hour),
	})
}

func ClearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     cookieName,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
	})
}

func UserIDFromCookie(r *http.Request) (int64, error) {
	c, err := r.Cookie(cookieName)
	if err != nil {
		return 0, fmt.Errorf("no session cookie")
	}
	id, ok := verifyToken(c.Value)
	if !ok {
		return 0, fmt.Errorf("invalid session token")
	}
	return id, nil
}
