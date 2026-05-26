package model

import "selwa/db"

type OrderItemInput struct {
	ProductID *int64  `json:"product_id"`
	Name      string  `json:"name"`
	Quantity  int     `json:"quantity"`
	UnitPrice float64 `json:"unit_price"`
}

type CreateOrderInput struct {
	Items []OrderItemInput `json:"items"`
}

func CreateOrder(userID int64, input CreateOrderInput) (int64, error) {
	var total float64
	for _, item := range input.Items {
		total += item.UnitPrice * float64(item.Quantity)
	}

	tx, err := db.Db.Begin()
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	var orderID int64
	err = tx.QueryRow(
		`INSERT INTO orders (user_id, total_amount) VALUES ($1, $2) RETURNING id`,
		userID, total,
	).Scan(&orderID)
	if err != nil {
		return 0, err
	}

	for _, item := range input.Items {
		if _, err = tx.Exec(
			`INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, $3, $4)`,
			orderID, item.ProductID, item.Quantity, item.UnitPrice,
		); err != nil {
			return 0, err
		}
	}

	return orderID, tx.Commit()
}
