package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"selwa/model"
	"selwa/utils"
)

type AuthResponse struct {
	Message string      `json:"message"`
	User    *model.User `json:"user"`
}

func Signup(w http.ResponseWriter, r *http.Request) {
	var input model.CreateUserInput

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		utils.ResponseWithError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}
	defer r.Body.Close()

	if input.Name == "" || input.Email == "" || input.Password == "" {
		utils.ResponseWithError(w, http.StatusBadRequest, "Name, email, and password are required")
		return
	}

	user := &model.User{}
	if err := user.Create(input); err != nil {
		if errors.Is(err, model.ErrDuplicateEmail) {
			utils.ResponseWithError(w, http.StatusConflict, "Email already exists")
			return
		}

		utils.ResponseWithError(w, http.StatusInternalServerError, "Failed to create user")
		return
	}

	utils.ResponseWithJSON(w, http.StatusCreated, AuthResponse{
		Message: "Account created successfully",
		User:    user,
	})
}

func Login(w http.ResponseWriter, r *http.Request) {
	var input model.LoginInput

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		utils.ResponseWithError(w, http.StatusBadRequest, "Invalid JSON")
		return
	}
	defer r.Body.Close()

	if input.Email == "" || input.Password == "" {
		utils.ResponseWithError(w, http.StatusBadRequest, "Email and password are required")
		return
	}

	user, err := model.ValidateUserCredentials(input.Email, input.Password)
	if err != nil {
		if errors.Is(err, model.ErrInvalidCredentials) {
			utils.ResponseWithError(w, http.StatusUnauthorized, "Invalid email or password")
			return
		}

		utils.ResponseWithError(w, http.StatusInternalServerError, "Failed to login")
		return
	}

	utils.ResponseWithJSON(w, http.StatusOK, AuthResponse{
		Message: "Login successful",
		User:    user,
	})
}
