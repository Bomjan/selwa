CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS artisans (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    craft_type VARCHAR(100) NOT NULL,
    bio TEXT
);

CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    artisan_id BIGINT REFERENCES artisans(id),
    region VARCHAR(100),
    materials TEXT,
    stock_quantity INTEGER DEFAULT 0,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO artisans (name, location, craft_type, bio) VALUES
    ('Pema Choden', 'Thimphu', 'Weaving', 'Traditional textile artisan focused on Bhutanese ceremonial fabrics.'),
    ('Tashi Dorji', 'Paro', 'Woodcraft', 'Creates hand-carved wooden ritual and decorative items.'),
    ('Dechen Lhamo', 'Bumthang', 'Jewellery', 'Designs silver jewellery inspired by Bhutanese motifs.')
ON CONFLICT DO NOTHING;

INSERT INTO products (name, description, price, category, artisan_id, region, materials, stock_quantity, image_url) VALUES
    ('Handwoven Kishuthara', 'A traditional Bhutanese handwoven silk textile with ceremonial patterns.', 12000.00, 'Textiles', 1, 'Thimphu', 'Silk', 3, '/images/placeholder-kishuthara.jpg'),
    ('Prayer Flag Set', 'A colorful set of prayer flags made for home and festival use.', 850.00, 'Textiles', 1, 'Thimphu', 'Cotton', 15, '/images/placeholder-prayer-flags.jpg'),
    ('Carved Wooden Mask', 'A decorative wooden mask inspired by Bhutanese festival traditions.', 4200.00, 'Woodcraft', 2, 'Paro', 'Cypress wood', 4, '/images/placeholder-mask.jpg'),
    ('Butter Tea Bowl', 'A polished wooden bowl designed for traditional serving rituals.', 1600.00, 'Woodcraft', 2, 'Paro', 'Wood', 8, '/images/placeholder-bowl.jpg'),
    ('Silver Pendant', 'A handcrafted pendant with Bhutanese ornamental detailing.', 3200.00, 'Jewellery', 3, 'Bumthang', 'Silver', 6, '/images/placeholder-pendant.jpg')
ON CONFLICT DO NOTHING;
