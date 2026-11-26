# PayFlow REST API Documentation

## 1. Overview & Protocol Standards

The PayFlow REST API follows standard REST principles:
- **Base URL:** `http://localhost:8080` (or configured via environment)
- **Data Exchange Format:** `application/json`
- **Authentication:** Bearer Token via `Authorization: Bearer <JWT_TOKEN>`
- **Idempotency Header:** `Idempotency-Key: <unique_string>` on payment creation requests
- **OpenAPI / Swagger UI:** `http://localhost:8080/swagger-ui.html`
- **OpenAPI JSON Docs:** `http://localhost:8080/v3/api-docs`

---

## 2. Standard Error Response Structure

All exceptions and validation errors return a consistent JSON schema defined by `ApiErrorResponse.java`:

```json
{
  "timestamp": "2026-11-21T22:30:00",
  "status": 400,
  "error": "Validation Failed",
  "message": "One or more input fields failed validation constraints.",
  "path": "/api/payments",
  "validationErrors": {
    "amount": "Amount must be greater than zero",
    "currency": "Currency must be a valid 3-letter ISO code"
  }
}
```

### Standard Status Codes
| HTTP Status | Meaning | Scenario |
| :--- | :--- | :--- |
| **`200 OK`** | Success | Entity fetched, payment retried, or payment cancelled. |
| **`201 Created`** | Created | Customer registered, user account created, payment created. |
| **`204 No Content`** | Deleted | Customer successfully deleted. |
| **`400 Bad Request`** | Client Error | Input validation failure, malformed JSON, inactive customer payment attempt. |
| **`401 Unauthorized`** | Authentication Failure | Missing, invalid, or expired JWT token, bad credentials. |
| **`403 Forbidden`** | Authorization Failure | Caller lacks required role (e.g. non-admin performing admin action). |
| **`404 Not Found`** | Missing Resource | Customer or Payment ID does not exist. |
| **`409 Conflict`** | Resource Collision | Duplicate email, duplicate username, idempotency payload mismatch, or concurrency conflict. |
| **`422 Unprocessable`** | State Violation | Invalid payment state transition (e.g. retrying a SUCCESS payment). |
| **`502 Bad Gateway`** | Gateway Error | Upstream payment gateway failure or communication drop. |
| **`500 Server Error`** | Internal Failure | Unexpected internal runtime failure. |

---

## 3. Authentication APIs (`/api/auth`)

### 3.1 Register User
- **Method & Path:** `POST /api/auth/register`
- **Auth Required:** No (Public)
- **Description:** Registers a new operator or customer user account and returns a signed JWT token.

**Request Body (`RegisterUserRequest`):**
```json
{
  "username": "alex_mercer",
  "email": "alex@fintechlab.io",
  "password": "securePassword123",
  "role": "CUSTOMER"
}
```

**Response (`201 Created` - `AuthResponse`):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhbGV4X21lcmNlciIs...",
  "tokenType": "Bearer",
  "username": "alex_mercer",
  "email": "alex@fintechlab.io",
  "role": "CUSTOMER",
  "expiresInMs": 86400000
}
```

---

### 3.2 User Login
- **Method & Path:** `POST /api/auth/login`
- **Auth Required:** No (Public)
- **Description:** Authenticates credentials and issues a signed JWT access token.

**Request Body (`LoginRequest`):**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (`200 OK` - `AuthResponse`):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsInJvbGVz...",
  "tokenType": "Bearer",
  "username": "admin",
  "email": "admin@payflow.internal",
  "role": "ADMIN",
  "expiresInMs": 86400000
}
```

---

### 3.3 Get Current User Profile
- **Method & Path:** `GET /api/auth/me`
- **Auth Required:** Yes (`Bearer <token>`)
- **Description:** Returns profile and role claims of the authenticated caller.

**Response (`200 OK` - `UserResponse`):**
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@payflow.internal",
  "role": "ADMIN",
  "createdAt": "2026-11-20T10:00:00"
}
```

---

## 4. Customer Management APIs (`/api/customers`)

### 4.1 Register New Customer
- **Method & Path:** `POST /api/customers`
- **Auth Required:** Yes
- **Description:** Creates a new customer profile. Validates that email is unique and format is valid.

**Request Body (`CreateCustomerRequest`):**
```json
{
  "fullName": "Marcus Vance",
  "email": "marcus.vance@vanguard.co",
  "phoneNumber": "+1-555-0872",
  "status": "ACTIVE"
}
```

**Response (`201 Created` - `CustomerResponse`):**
```json
{
  "id": 5,
  "fullName": "Marcus Vance",
  "email": "marcus.vance@vanguard.co",
  "phoneNumber": "+1-555-0872",
  "status": "ACTIVE",
  "createdAt": "2026-11-21T14:30:00",
  "updatedAt": "2026-11-21T14:30:00"
}
```

---

### 4.2 List Customers (Paginated, Search & Filter)
- **Method & Path:** `GET /api/customers`
- **Auth Required:** Yes
- **Query Parameters:**
  - `search` *(optional)*: Substring search across `fullName`, `email`, or `phoneNumber`.
  - `status` *(optional)*: `ACTIVE`, `INACTIVE`, `SUSPENDED`.
  - `page` *(default 0)*: Zero-based page index.
  - `size` *(default 10)*: Page size.
  - `sortBy` *(default `createdAt`)*: Field to sort by.
  - `direction` *(default `desc`)*: `asc` or `desc`.

**Response (`200 OK` - `PageResponse<CustomerResponse>`):**
```json
{
  "content": [
    {
      "id": 1,
      "fullName": "Sarah Jenkins",
      "email": "sarah.jenkins@acme.com",
      "phoneNumber": "+1-555-0199",
      "status": "ACTIVE",
      "createdAt": "2026-11-19T10:00:00",
      "updatedAt": "2026-11-19T10:00:00"
    }
  ],
  "pageNumber": 0,
  "pageSize": 10,
  "totalElements": 5,
  "totalPages": 1,
  "isLast": true,
  "isFirst": true
}
```

---

### 4.3 Get Customer by ID
- **Method & Path:** `GET /api/customers/{id}`
- **Auth Required:** Yes
- **Response (`200 OK`):** `CustomerResponse`

---

### 4.4 Update Customer Profile
- **Method & Path:** `PUT /api/customers/{id}`
- **Auth Required:** Yes
- **Request Body (`UpdateCustomerRequest`):**
```json
{
  "fullName": "Sarah Jenkins-Smith",
  "email": "sarah.jenkins@acme.com",
  "phoneNumber": "+1-555-9999"
}
```
- **Response (`200 OK`):** Updated `CustomerResponse`

---

### 4.5 Update Customer Status
- **Method & Path:** `PATCH /api/customers/{id}/status`
- **Auth Required:** Yes
- **Request Body (`UpdateCustomerStatusRequest`):**
```json
{
  "status": "INACTIVE"
}
```
- **Response (`200 OK`):** Updated `CustomerResponse`

---

### 4.6 Get Customer Payments
- **Method & Path:** `GET /api/customers/{id}/payments`
- **Auth Required:** Yes
- **Query Parameters:** `page`, `size`, `sortBy`, `direction`
- **Response (`200 OK`):** `PageResponse<PaymentResponse>`

---

### 4.7 Delete Customer
- **Method & Path:** `DELETE /api/customers/{id}`
- **Auth Required:** Yes
- **Response (`204 No Content`):** Successfully deleted (only if no payments exist).
- **Error Response (`409 Conflict`):** If customer is linked to historical transactions.

---

## 5. Payment Management APIs (`/api/payments`)

### 5.1 Create & Process Payment
- **Method & Path:** `POST /api/payments`
- **Auth Required:** Yes
- **Headers:**
  - `Idempotency-Key: <unique_token>` *(optional in header if provided in body)*
- **Description:** Initiates payment processing with idempotency protection. Executes downstream gateway simulation atomically.

**Request Body (`CreatePaymentRequest`):**
```json
{
  "customerId": 1,
  "amount": 249.99,
  "currency": "USD",
  "description": "Enterprise SaaS License Renewal",
  "paymentMethod": "MOCK_CARD",
  "idempotencyKey": "idem_client_tx_98124"
}
```

**Response (`201 Created` - `PaymentResponse`):**
```json
{
  "id": 101,
  "customerId": 1,
  "customerName": "Sarah Jenkins",
  "customerEmail": "sarah.jenkins@acme.com",
  "amount": 249.99,
  "currency": "USD",
  "description": "Enterprise SaaS License Renewal",
  "status": "SUCCESS",
  "paymentMethod": "MOCK_CARD",
  "idempotencyKey": "idem_client_tx_98124",
  "gatewayReference": "pg_tx_a8f3b92c10de",
  "failureReason": null,
  "version": 0,
  "createdAt": "2026-11-21T22:31:00",
  "updatedAt": "2026-11-21T22:31:00"
}
```

**Idempotency Outcomes:**
1. **First Request:** Processed, settled, record stored (`201 Created`).
2. **Identical Replay:** Returns existing record with original ID and gateway reference (`201 Created`).
3. **Reused Key with Changed Payload (e.g. amount altered):** Returns `409 Conflict` (`Idempotency Conflict: parameters differ`).

---

### 5.2 List Payments (Filtered, Paginated)
- **Method & Path:** `GET /api/payments`
- **Auth Required:** Yes
- **Query Parameters:**
  - `search` *(optional)*: Matches payment ID, customer name, email, gateway ref, or idempotency key.
  - `status` *(optional)*: `CREATED`, `PENDING`, `SUCCESS`, `FAILED`, `CANCELLED`.
  - `startDate` *(optional, ISO `YYYY-MM-DD`)*: Beginning of date range.
  - `endDate` *(optional, ISO `YYYY-MM-DD`)*: End of date range.
  - `page`, `size`, `sortBy`, `direction`
- **Response (`200 OK`):** `PageResponse<PaymentResponse>`

---

### 5.3 Get Payment by ID
- **Method & Path:** `GET /api/payments/{id}`
- **Auth Required:** Yes
- **Response (`200 OK`):** `PaymentResponse`

---

### 5.4 Get Payment Complete Detail (With Attempts & Audit History)
- **Method & Path:** `GET /api/payments/{id}/detail`
- **Auth Required:** Yes
- **Description:** Returns the payment record, all gateway attempt executions, and the chronological audit trail.

**Response (`200 OK` - `PaymentDetailResponse`):**
```json
{
  "payment": {
    "id": 101,
    "customerId": 1,
    "customerName": "Sarah Jenkins",
    "customerEmail": "sarah.jenkins@acme.com",
    "amount": 249.99,
    "currency": "USD",
    "status": "SUCCESS",
    "paymentMethod": "MOCK_CARD",
    "idempotencyKey": "idem_client_tx_98124",
    "gatewayReference": "pg_tx_a8f3b92c10de",
    "failureReason": null,
    "version": 0,
    "createdAt": "2026-11-21T22:31:00",
    "updatedAt": "2026-11-21T22:31:00"
  },
  "attempts": [
    {
      "id": 12,
      "paymentId": 101,
      "attemptNumber": 1,
      "gatewayReference": "pg_tx_a8f3b92c10de",
      "status": "SUCCESS",
      "failureReason": null,
      "latencyMs": 145,
      "createdAt": "2026-11-21T22:31:00"
    }
  ],
  "history": [
    {
      "id": 45,
      "paymentId": 101,
      "eventType": "PAYMENT_SUCCEEDED",
      "previousStatus": "PENDING",
      "newStatus": "SUCCESS",
      "eventDescription": "Payment settled successfully. Gateway Ref: pg_tx_a8f3b92c10de",
      "createdBy": "admin",
      "createdAt": "2026-11-21T22:31:00"
    },
    {
      "id": 44,
      "paymentId": 101,
      "eventType": "PAYMENT_PROCESSING_STARTED",
      "previousStatus": "CREATED",
      "newStatus": "PENDING",
      "eventDescription": "Payment dispatched to gateway engine [MOCK_GATEWAY_V1]",
      "createdBy": "admin",
      "createdAt": "2026-11-21T22:31:00"
    },
    {
      "id": 43,
      "paymentId": 101,
      "eventType": "PAYMENT_CREATED",
      "previousStatus": null,
      "newStatus": "CREATED",
      "eventDescription": "Payment initiated with idempotency key [idem_client_tx_98124]",
      "createdBy": "admin",
      "createdAt": "2026-11-21T22:31:00"
    }
  ]
}
```

---

### 5.5 Retry Failed Payment
- **Method & Path:** `POST /api/payments/{id}/retry`
- **Auth Required:** Yes
- **Description:** Re-dispatches a payment in `FAILED` state to the payment gateway with an incremented attempt number.
- **Precondition:** Current status must be `FAILED`.
- **Response (`200 OK`):** Updated `PaymentResponse`
- **Error Response (`422 Unprocessable Entity`):** If payment is not in `FAILED` state.

---

### 5.6 Cancel Pending Payment
- **Method & Path:** `POST /api/payments/{id}/cancel`
- **Auth Required:** Yes
- **Description:** Explicitly marks a `CREATED` or `PENDING` payment as `CANCELLED`.
- **Response (`200 OK`):** Updated `PaymentResponse` (status `CANCELLED`).
- **Error Response (`422 Unprocessable Entity`):** If payment is already terminal (`SUCCESS` or `FAILED`).

---

### 5.7 Get Payment Audit History
- **Method & Path:** `GET /api/payments/{id}/history`
- **Auth Required:** Yes
- **Response (`200 OK`):** `List<PaymentAuditLogResponse>`

---

## 6. Dashboard & Analytics APIs (`/api/dashboard`)

### 6.1 Get Summary Metrics
- **Method & Path:** `GET /api/dashboard/summary`
- **Auth Required:** Yes
- **Description:** Aggregates real-time transaction totals, counts, liquidity volume, and success rate.

**Response (`200 OK` - `DashboardSummaryResponse`):**
```json
{
  "totalCustomers": 5,
  "totalPayments": 12,
  "successfulPayments": 9,
  "failedPayments": 2,
  "pendingPayments": 1,
  "cancelledPayments": 0,
  "totalVolume": 4350.50,
  "successRate": 75.0,
  "averageAmount": 483.39
}
```

---

### 6.2 Get Payment Time-Series Trends
- **Method & Path:** `GET /api/dashboard/payment-trends`
- **Auth Required:** Yes
- **Query Parameters:** `days` *(default 7, max 90)*
- **Description:** Daily grouped settlement telemetry. Missing days are automatically pre-populated with zero.

**Response (`200 OK` - `List<PaymentTrendResponse>`):**
```json
[
  {
    "date": "2026-11-15",
    "totalCount": 2,
    "successCount": 2,
    "failedCount": 0,
    "volume": 650.00
  },
  {
    "date": "2026-11-16",
    "totalCount": 4,
    "successCount": 3,
    "failedCount": 1,
    "volume": 1200.50
  }
]
```

---

### 6.3 Get Recent Transactions
- **Method & Path:** `GET /api/dashboard/recent-payments`
- **Auth Required:** Yes
- **Description:** Returns the top 10 most recent transactions.
- **Response (`200 OK`):** `List<PaymentResponse>`

---

## 7. Gateway Simulation Controls (`/api/gateway`)

### 7.1 Get Gateway Simulation Configuration
- **Method & Path:** `GET /api/gateway/config`
- **Auth Required:** Yes
- **Response (`200 OK`):**
```json
{
  "providerName": "MOCK_GATEWAY_V1",
  "forceFailure": false,
  "defaultLatencyMs": 150
}
```

---

### 7.2 Toggle Gateway Simulated Failure Mode
- **Method & Path:** `POST /api/gateway/config/toggle-failure`
- **Auth Required:** Yes
- **Query Parameters:** `enabled` *(optional boolean; toggles current state if omitted)*
- **Description:** Allows test engineers to dynamically force upstream gateway rejections to test system retry and error handling capabilities.
- **Response (`200 OK`):**
```json
{
  "forceFailure": true,
  "message": "Gateway failure simulation ENABLED"
}
```
