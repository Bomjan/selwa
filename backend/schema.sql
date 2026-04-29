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

-- Wipe and re-seed so this script is safe to re-run
TRUNCATE TABLE products, artisans RESTART IDENTITY CASCADE;

INSERT INTO artisans (name, location, craft_type, bio) VALUES
    ('Karma Choden',    'Thimphu', 'Crafts',   'Traditional artisan specialising in bamboo weaving and handmade Bhutanese craft objects.'),
    ('Tashi Dorji',     'Paro',    'Woodcraft', 'Wood carver and craftsman producing ceremonial and decorative pieces from local timber.'),
    ('Dorji Wangchuk',  'Bumthang','Wellness',  'Organic farmer and producer of wild-harvested honey, cordyceps, and traditional food products.'),
    ('Kinley Pem',      'Thimphu', 'Wellness',  'Herbalist and aromatherapist creating Bhutanese botanical wellness products.');

INSERT INTO products (name, description, price, category, artisan_id, region, materials, stock_quantity, image_url) VALUES
    ('Bangchung',              'A traditional Bhutanese woven bamboo container used for storing and carrying food. Handwoven using split bamboo strips.',                                              800.00,  'Crafts',   1, 'Thimphu', 'Bamboo',                    12, '/images/bangchung.avif'),
    ('Palang',                 'A carved wooden serving board used in traditional Bhutanese households for ceremonial and everyday food presentation.',                                              2200.00, 'Crafts',   2, 'Paro',    'Hardwood',                  6,  '/images/palang.avif'),
    ('Bhutanese Tea Cup',      'A handcrafted ceramic tea cup made using traditional Bhutanese pottery techniques. Perfect for serving butter tea or herbal infusions.',                            950.00,  'Pottery',  1, 'Thimphu', 'Clay',                      10, '/images/tea-cup.avif'),
    ('Happiness Tea',          'A soothing herbal tea blend sourced from high-altitude Bhutanese valleys. Contains a mix of wild herbs known for their calming properties.',                        450.00,  'Wellness', 3, 'Bumthang', 'Wild herbs',               20, '/images/happiness-tea.avif'),
    ('Himalayan Tea',          'A rich black tea grown and processed in Bhutan''s pristine mountain regions. Minimal processing preserves the natural flavour.',                                    480.00,  'Wellness', 3, 'Bumthang', 'Black tea leaves',          18, '/images/himalayan-tea.avif'),
    ('High Altitude Honey',    'Raw honey collected from beehives at elevations above 3,000 metres in Bhutan. Unfiltered and unprocessed for maximum natural goodness.',                           950.00,  'Food',     3, 'Bumthang', 'Raw honey',                 8,  '/images/high-altitude-honey.avif'),
    ('Honey from Bumthang',    'Single-origin wildflower honey from the Bumthang valley. Harvested by small-scale beekeepers using traditional methods.',                                          1100.00, 'Food',     3, 'Bumthang', 'Wildflower honey',          7,  '/images/honey-bumthang.avif'),
    ('Wild Cordyceps',         'Rare wild cordyceps mushroom harvested at high altitudes in Bhutan. Traditionally used in Bhutanese and Tibetan wellness practices.',                              3500.00, 'Wellness', 3, 'Bumthang', 'Wild cordyceps fungus',     4,  '/images/cordyceps.avif'),
    ('Menjong Sorig Cream',    'An herbal cream formulated using traditional Sowa Rigpa medicine principles. Made with Himalayan botanical extracts.',                                              850.00,  'Wellness', 4, 'Thimphu', 'Herbal extracts',           15, '/images/menjong-sorig.avif'),
    ('Lemongrass Room Spray',  'A natural room spray distilled from organically grown lemongrass. Light and refreshing, inspired by Bhutanese botanical traditions.',                              650.00,  'Wellness', 4, 'Thimphu', 'Lemongrass essential oil',  14, '/images/lemongrass-spray.avif'),
    ('Incense Sticks',         'Traditional Bhutanese incense handrolled from a blend of aromatic mountain herbs and resins. Used in temples and homes across Bhutan.',                            350.00,  'Crafts',   1, 'Thimphu', 'Herbal resins, wood powder', 25, '/images/incense-stick.avif'),
    ('Tsholam Keychain',       'A small decorative keychain shaped after the Tsholam, a traditional Bhutanese symbol. Handcrafted as a meaningful souvenir.',                                     280.00,  'Crafts',   2, 'Paro',    'Resin',                     30, '/images/tsholam-keychain.avif'),
    ('Taktshang Souvenir',     'A hand-painted decorative piece depicting the Tiger''s Nest monastery. A lasting keepsake from one of Bhutan''s most iconic landmarks.',                          750.00,  'Crafts',   2, 'Paro',    'Wood, paint',               12, '/images/taktshang-souvenir.avif'),
    ('Zoedow Ezay',            'A traditional Bhutanese chili relish made with dried red chilies, cheese, and local spices. A staple condiment in Bhutanese cuisine.',                            380.00,  'Food',     3, 'Bumthang', 'Dried chilies, cheese',     20, '/images/zoedow-ezay.avif'),
    ('Bumthapa Puta',          'Traditional Bhutanese buckwheat noodles from the Bumthang region. Stone-ground and sun-dried using methods passed down through generations.',                      420.00,  'Food',     3, 'Bumthang', 'Buckwheat',                 16, '/images/bumthapa-puta.avif'),
    ('Selwa Gift Set',         'A curated gift set featuring a selection of Bhutanese craft and wellness products. Thoughtfully packaged for gifting or personal collection.',                     2800.00, 'Crafts',   1, 'Thimphu', 'Mixed',                     5,  '/images/gift.webp');
