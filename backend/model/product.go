package model

import (
	"database/sql"
	"errors"
	"selwa/db"
)

var ErrProductNotFound = errors.New("product not found")

type CreateProductInput struct {
	Name          string  `json:"name"`
	Description   string  `json:"description"`
	Price         float64 `json:"price"`
	Category      string  `json:"category"`
	ArtisanID     *int64  `json:"artisan_id"`
	Region        string  `json:"region"`
	Materials     string  `json:"materials"`
	StockQuantity int     `json:"stock_quantity"`
	ImageURL      string  `json:"image_url"`
}

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

	err := db.Db.QueryRow(queryGetProductByID, p.ID).Scan(
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

func CreateProduct(input CreateProductInput) (*Product, error) {
	var id int64
	err := db.Db.QueryRow(`
		INSERT INTO products (name, description, price, category, artisan_id, region, materials, stock_quantity, image_url)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
		RETURNING id`,
		input.Name, input.Description, input.Price, input.Category,
		input.ArtisanID, input.Region, input.Materials, input.StockQuantity, input.ImageURL,
	).Scan(&id)
	if err != nil {
		return nil, err
	}
	p := &Product{ID: id}
	return p, p.Read()
}

func UpdateProduct(id int64, input CreateProductInput) (*Product, error) {
	_, err := db.Db.Exec(`
		UPDATE products SET name=$1, description=$2, price=$3, category=$4,
		artisan_id=$5, region=$6, materials=$7, stock_quantity=$8, image_url=$9
		WHERE id=$10`,
		input.Name, input.Description, input.Price, input.Category,
		input.ArtisanID, input.Region, input.Materials, input.StockQuantity, input.ImageURL, id,
	)
	if err != nil {
		return nil, err
	}
	p := &Product{ID: id}
	if err := p.Read(); err != nil {
		return nil, err
	}
	return p, nil
}

func DeleteProduct(id int64) error {
	res, err := db.Db.Exec(`DELETE FROM products WHERE id=$1`, id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrProductNotFound
	}
	return nil
}

func GetAdminStats() (map[string]int64, error) {
	stats := map[string]int64{}
	rows := []struct {
		key   string
		query string
	}{
		{"users", "SELECT COUNT(*) FROM users"},
		{"products", "SELECT COUNT(*) FROM products"},
		{"orders", "SELECT COUNT(*) FROM orders"},
	}
	for _, r := range rows {
		var n int64
		if err := db.Db.QueryRow(r.query).Scan(&n); err != nil {
			return nil, err
		}
		stats[r.key] = n
	}
	var rev sql.NullFloat64
	if err := db.Db.QueryRow("SELECT SUM(total_amount) FROM orders WHERE status != 'cancelled'").Scan(&rev); err != nil {
		return nil, err
	}
	stats["revenue_nu"] = int64(rev.Float64)
	return stats, nil
}

type OrderUser struct {
	ID    int64  `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

type OrderRow struct {
	ID          int64     `json:"id"`
	Status      string    `json:"status"`
	TotalAmount float64   `json:"total_amount"`
	CreatedAt   string    `json:"created_at"`
	User        OrderUser `json:"user"`
}

func GetAllOrders() ([]OrderRow, error) {
	rows, err := db.Db.Query(`
		SELECT o.id, o.status, o.total_amount, o.created_at,
		       u.id, u.name, u.email
		FROM orders o
		JOIN users u ON o.user_id = u.id
		ORDER BY o.created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := []OrderRow{}
	for rows.Next() {
		var row OrderRow
		if err := rows.Scan(
			&row.ID, &row.Status, &row.TotalAmount, &row.CreatedAt,
			&row.User.ID, &row.User.Name, &row.User.Email,
		); err != nil {
			return nil, err
		}
		result = append(result, row)
	}
	return result, rows.Err()
}

func GetAllProducts() ([]Product, error) {
	rows, err := db.Db.Query(queryGetAllProducts)
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
