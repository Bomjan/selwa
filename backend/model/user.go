package model

import (
	"database/sql"
	"errors"
	"selwa/db"

	"github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrDuplicateEmail     = errors.New("duplicate email")
	ErrInvalidCredentials = errors.New("invalid credentials")
)

const (
	queryInsertUser = `
		INSERT INTO users (name, email, password_hash)
		VALUES ($1, $2, $3)
		RETURNING id;
	`
	queryGetUserByEmail = `
		SELECT id, name, email, password_hash
		FROM users
		WHERE email = $1;
	`
)

type User struct {
	ID    int64  `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

type CreateUserInput struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (u *User) Create(input CreateUserInput) error {
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	err = db.Db.QueryRow(queryInsertUser, input.Name, input.Email, string(passwordHash)).Scan(&u.ID)
	if err != nil {
		var pqErr *pq.Error
		if errors.As(err, &pqErr) && pqErr.Code == "23505" {
			return ErrDuplicateEmail
		}
		return err
	}

	u.Name = input.Name
	u.Email = input.Email
	return nil
}

func GetUserByEmail(email string) (*User, string, error) {
	var user User
	var passwordHash string

	err := db.Db.QueryRow(queryGetUserByEmail, email).Scan(
		&user.ID,
		&user.Name,
		&user.Email,
		&passwordHash,
	)
	if err != nil {
		return nil, "", err
	}

	return &user, passwordHash, nil
}

func ValidateUserCredentials(email, password string) (*User, error) {
	user, passwordHash, err := GetUserByEmail(email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	return user, nil
}
