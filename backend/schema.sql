-- Run this once to create tables.
-- Uses IF NOT EXISTS so it is safe to re-run without wiping data.

CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS artisans (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    location   VARCHAR(255) NOT NULL,
    craft_type VARCHAR(100) NOT NULL,
    bio        TEXT
);

CREATE TABLE IF NOT EXISTS products (
    id             BIGSERIAL PRIMARY KEY,
    name           VARCHAR(255) NOT NULL,
    description    TEXT NOT NULL,
    price          DECIMAL(10,2) NOT NULL,
    category       VARCHAR(100) NOT NULL,
    artisan_id     BIGINT REFERENCES artisans(id),
    region         VARCHAR(100),
    materials      TEXT,
    stock_quantity INTEGER DEFAULT 0,
    image_url      VARCHAR(500),
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
