package model

import "selwa/db"

type WishlistItem struct {
	ID       int64   `json:"id"`
	Name     string  `json:"name"`
	Price    float64 `json:"price"`
	ImageURL string  `json:"image_url"`
	Category string  `json:"category"`
}

func GetWishlist(userID int64) ([]WishlistItem, error) {
	rows, err := db.Db.Query(`
		SELECT p.id, p.name, p.price, COALESCE(p.image_url,''), p.category
		FROM wishlists w
		JOIN products p ON p.id = w.product_id
		WHERE w.user_id = $1
		ORDER BY w.created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []WishlistItem{}
	for rows.Next() {
		var item WishlistItem
		if err := rows.Scan(&item.ID, &item.Name, &item.Price, &item.ImageURL, &item.Category); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func AddToWishlist(userID, productID int64) error {
	_, err := db.Db.Exec(`
		INSERT INTO wishlists (user_id, product_id) VALUES ($1, $2)
		ON CONFLICT (user_id, product_id) DO NOTHING
	`, userID, productID)
	return err
}

func RemoveFromWishlist(userID, productID int64) error {
	_, err := db.Db.Exec(
		`DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2`,
		userID, productID,
	)
	return err
}
