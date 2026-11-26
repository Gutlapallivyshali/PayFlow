-- =============================================================================
-- PayFlow Database Migration V2: Seed Initial Data
-- Standard SQL-compliant initial seeding for PostgreSQL and H2
-- =============================================================================

-- Initial Demo Users
INSERT INTO users (username, email, password_hash, role, created_at, updated_at)
VALUES 
('admin', 'admin@payflow.internal', '$2a$10$1aTvScn9NAebN/ceaQYxmOKkVRrluXMEc/0aY5VYraJDRbedLzhEW', 'ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('sarah', 'sarah.jenkins@acme.com', '$2a$10$/z7sGjsSuWnjUmbEHMWmvON1lOamqIU1x9.XsvmEcQd0H1YYLiF6u', 'CUSTOMER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Initial Demo Customers
INSERT INTO customers (full_name, email, phone_number, status, created_at, updated_at)
VALUES 
('Sarah Jenkins', 'sarah.jenkins@acme.com', '+1-555-0199', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Alex Mercer', 'alex.mercer@fintechlab.io', '+1-555-0248', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Elena Rostova', 'elena.rostova@cloudscale.net', '+44-20-7946-0912', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('David Chen', 'david.chen@nexuspay.org', '+65-6789-1234', 'INACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Marcus Vance', 'marcus.vance@vanguard.co', '+1-555-0872', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Initial Demo Payments
INSERT INTO payments (customer_id, amount, currency, description, status, payment_method, idempotency_key, gateway_reference, failure_reason, version, created_at, updated_at)
VALUES 
(1, 249.99, 'USD', 'Enterprise SaaS Subscription', 'SUCCESS', 'MOCK_CARD', 'idem_init_0001_seed', 'pg_tx_9a8b7c6d5e4f3a2b', NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 1200.00, 'USD', 'Cloud Server Cluster Billing', 'SUCCESS', 'MOCK_UPI', 'idem_init_0002_seed', 'pg_tx_1f2e3d4c5b6a7f8e', NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 45.50, 'EUR', 'Domain Registration Renewal', 'FAILED', 'MOCK_CARD', 'idem_init_0003_seed', 'pg_tx_failed_4550_01', 'Insufficient customer balance or card declined', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(1, 89.00, 'USD', 'API Developer Pro License', 'SUCCESS', 'MOCK_WALLET', 'idem_init_0004_seed', 'pg_tx_7c8d9e0f1a2b3c4d', NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 550.00, 'USD', 'Quarterly Security Audit', 'PENDING', 'MOCK_CARD', 'idem_init_0005_seed', 'pg_tx_pending_5500_01', NULL, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Seed Payment Attempts
INSERT INTO payment_attempts (payment_id, attempt_number, gateway_reference, status, failure_reason, latency_ms, created_at)
VALUES 
(1, 1, 'pg_tx_9a8b7c6d5e4f3a2b', 'SUCCESS', NULL, 185, CURRENT_TIMESTAMP),
(2, 1, 'pg_tx_1f2e3d4c5b6a7f8e', 'SUCCESS', NULL, 240, CURRENT_TIMESTAMP),
(3, 1, 'pg_tx_failed_4550_01', 'FAILED', 'Insufficient customer balance or card declined', 310, CURRENT_TIMESTAMP),
(4, 1, 'pg_tx_7c8d9e0f1a2b3c4d', 'SUCCESS', NULL, 120, CURRENT_TIMESTAMP),
(5, 1, 'pg_tx_pending_5500_01', 'PENDING', NULL, 95, CURRENT_TIMESTAMP);

-- Seed Payment Audit Logs
INSERT INTO payment_audit_logs (payment_id, event_type, previous_status, new_status, event_description, created_by, created_at)
VALUES 
(1, 'PAYMENT_CREATED', NULL, 'CREATED', 'Payment initialized with idempotency key idem_init_0001_seed', 'sarah', CURRENT_TIMESTAMP),
(1, 'PAYMENT_SUCCEEDED', 'PENDING', 'SUCCESS', 'MockGateway transaction settled successfully. Ref: pg_tx_9a8b7c6d5e4f3a2b', 'SYSTEM', CURRENT_TIMESTAMP),
(2, 'PAYMENT_CREATED', NULL, 'CREATED', 'Payment initialized with idempotency key idem_init_0002_seed', 'alex', CURRENT_TIMESTAMP),
(2, 'PAYMENT_SUCCEEDED', 'PENDING', 'SUCCESS', 'MockGateway transaction settled successfully. Ref: pg_tx_1f2e3d4c5b6a7f8e', 'SYSTEM', CURRENT_TIMESTAMP),
(3, 'PAYMENT_CREATED', NULL, 'CREATED', 'Payment initialized with idempotency key idem_init_0003_seed', 'elena', CURRENT_TIMESTAMP),
(3, 'PAYMENT_FAILED', 'PENDING', 'FAILED', 'Gateway declined: Insufficient customer balance or card declined', 'SYSTEM', CURRENT_TIMESTAMP),
(4, 'PAYMENT_CREATED', NULL, 'CREATED', 'Payment initialized with idempotency key idem_init_0004_seed', 'sarah', CURRENT_TIMESTAMP),
(4, 'PAYMENT_SUCCEEDED', 'PENDING', 'SUCCESS', 'MockGateway transaction settled successfully. Ref: pg_tx_7c8d9e0f1a2b3c4d', 'SYSTEM', CURRENT_TIMESTAMP),
(5, 'PAYMENT_CREATED', NULL, 'CREATED', 'Payment initialized with idempotency key idem_init_0005_seed', 'marcus', CURRENT_TIMESTAMP);
