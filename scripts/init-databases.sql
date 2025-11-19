-- Create databases for each service
CREATE DATABASE ecommerce_auth;
CREATE DATABASE ecommerce_products;
CREATE DATABASE ecommerce_orders;

-- Grant privileges (already postgres user, but for clarity)
GRANT ALL PRIVILEGES ON DATABASE ecommerce_auth TO postgres;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_products TO postgres;
GRANT ALL PRIVILEGES ON DATABASE ecommerce_orders TO postgres;
