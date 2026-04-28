package model

import (
	"database/sql"
	"errors"
	"selwa/dataStore/postgres"
)

var ErrProductNotFound = errors.New("product not found")

const (
	queryGetAllProducts = `
		SELECT
			p.id,
			p.name,
			p.description,
			p.price,
			p.category,
			p.region,
			p.materials,
			p.stock_quantity,
			p.image_url,
			a.id,
			a.name,
			a.location,
			a.craft_type
		FROM products p
		LEFT JOIN artisans a ON p.artisan_id = a.id
		ORDER BY p.id;
	`
	queryGetProductByID = `
		SELECT
			p.id,
			p.name,
			p.description,
			p.price,
			p.category,
			p.region,
			p.materials,
			p.stock_quantity,
			p.image_url,
			a.id,
			a.name,
			a.location,
			a.craft_type
		FROM products p
		LEFT JOIN artisans a ON p.artisan_id = a.id
		WHERE p.id = $1;
	`
)

type ArtisanSummary struct {
	ID        int64  `json:"id"`
	Name      string `json:"name"`
	Location  string `json:"location"`
	CraftType string `json:"craft_type"`
}

type Product struct {
	ID            int64          `json:"id"`
	Name          string         `json:"name"`
	Description   string         `json:"description"`
	Price         float64        `json:"price"`
	Category      string         `json:"category"`
	Region        string         `json:"region"`
	Materials     string         `json:"materials"`
	StockQuantity int            `json:"stock_quantity"`
	ImageURL      string         `json:"image_url"`
	Artisan       ArtisanSummary `json:"artisan"`
}

func (p *Product) Read() error {
	var artisanID sql.NullInt64
	var artisanName sql.NullString
	var artisanLocation sql.NullString
	var artisanCraftType sql.NullString

	err := postgres.Db.QueryRow(queryGetProductByID, p.ID).Scan(
		&p.ID,
		&p.Name,
		&p.Description,
		&p.Price,
		&p.Category,
		&p.Region,
		&p.Materials,
		&p.StockQuantity,
		&p.ImageURL,
		&artisanID,
		&artisanName,
		&artisanLocation,
		&artisanCraftType,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrProductNotFound
		}
		return err
	}

	p.Artisan = ArtisanSummary{
		ID:        artisanID.Int64,
		Name:      artisanName.String,
		Location:  artisanLocation.String,
		CraftType: artisanCraftType.String,
	}

	return nil
}

func GetAllProducts() ([]Product, error) {
	rows, err := postgres.Db.Query(queryGetAllProducts)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	products := []Product{}
	for rows.Next() {
		var p Product
		var artisanID sql.NullInt64
		var artisanName sql.NullString
		var artisanLocation sql.NullString
		var artisanCraftType sql.NullString

		if err := rows.Scan(
			&p.ID,
			&p.Name,
			&p.Description,
			&p.Price,
			&p.Category,
			&p.Region,
			&p.Materials,
			&p.StockQuantity,
			&p.ImageURL,
			&artisanID,
			&artisanName,
			&artisanLocation,
			&artisanCraftType,
		); err != nil {
			return nil, err
		}

		p.Artisan = ArtisanSummary{
			ID:        artisanID.Int64,
			Name:      artisanName.String,
			Location:  artisanLocation.String,
			CraftType: artisanCraftType.String,
		}

		products = append(products, p)
	}

	return products, rows.Err()
}
