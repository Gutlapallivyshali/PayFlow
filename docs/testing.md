# PayFlow Automated Testing & Quality Assurance Guide

## 1. Testing Strategy & Philosophy

PayFlow follows the **Testing Pyramid** methodology to ensure high reliability across critical payment flows:

```
           / \
          /   \
         /  E2E \         (Manual Verification & Postman / Swagger)
        /---------\
       / Integration\     (Spring Boot MockMvc, Flyway, H2 in PostgreSQL Mode)
      /---------------\
     /   Unit Tests    \  (JUnit 5, Mockito, Vitest, React Testing Library)
    /-------------------\
```

- **Unit Tests:** Fast, isolated tests focusing on domain logic, idempotency resolution, state transitions, and gateway boundary checks without booting web servers or database connections.
- **Integration Tests:** Full Spring context tests validating Spring Security filters, JSON serialization, database schema constraints via Flyway, and HTTP status code mappings using `MockMvc`.
- **Frontend Tests:** Component tests verifying accessibility, loading states, status badge styling, pagination boundaries, and confirmation modal workflows using Vitest and React Testing Library.

---

## 2. Test Environment & Database Strategy

### Why H2 in PostgreSQL Mode for Testing?
Real-world enterprise applications must balance test realism with developer velocity:
1. **Zero External Dependencies:** Running `mvn test` does not require a pre-installed, running PostgreSQL service or Docker daemon.
2. **PostgreSQL Compatibility Mode:** Configured with `MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE`, ensuring standard SQL statements, constraints, and identity columns behave consistently.
3. **Database Isolation:** Tests run against in-memory `jdbc:h2:mem:payflow_test;DB_CLOSE_DELAY=-1`, completely preventing any risk of wiping or corrupting a developer's local or production database.
4. **Flyway Migration Validation:** Flyway automatically applies `V1__init_schema.sql` and `V2__seed_demo_data.sql` during test context startup, proving migrations are syntactically valid on every test run.

---

## 3. Backend Test Suite Breakdown (30 Tests)

### 3.1 Service Unit Tests (`com.payflow.service`)

#### `CustomerServiceTest.java` (8 Tests)
- `shouldCreateCustomerSuccessfully`: Verifies customer creation, trimming, lowercasing of email, and saving to repository.
- `shouldThrowWhenEmailAlreadyExists`: Ensures `DuplicateResourceException` is thrown and repository save is never called when email exists.
- `shouldGetCustomerById`: Validates finding existing customer by primary key.
- `shouldThrowWhenCustomerNotFound`: Asserts `ResourceNotFoundException` is raised when customer ID is absent.
- `shouldUpdateCustomer`: Verifies email and name modification rules.
- `shouldUpdateCustomerStatus`: Verifies state changes (`ACTIVE` -> `INACTIVE`).
- `shouldPreventDeletingCustomerWithPayments`: Validates critical financial retention rule—refuses deletion when transactions exist.
- `shouldListCustomersWithPagination`: Validates `PageResponse<CustomerResponse>` mapping.

#### `PaymentServiceTest.java` (9 Tests)
- `shouldCreateAndProcessPaymentSuccessfully`: Mocks active customer and successful gateway settlement; asserts status `SUCCESS` and gateway ref saved.
- `shouldHandleGatewayDeclineCorrectly`: Mocks gateway rejection; verifies status transitions to `FAILED` and `failureReason` is recorded.
- `shouldThrowWhenCustomerNotFound`: Rejects payment creation when customer ID does not exist.
- `shouldRejectPaymentForInactiveCustomer`: Asserts `InactiveCustomerException` is thrown when customer status is `INACTIVE`.
- `shouldReturnExistingPaymentOnIdempotentReplay`: Submits exact same idempotency key; verifies existing payment is returned without calling gateway.
- `shouldRetryFailedPayment`: Validates that a `FAILED` payment transitions to `PENDING`, increments attempt number, and settles.
- `shouldRejectRetryOnNonFailedPayment`: Verifies `InvalidPaymentStateException` is thrown if attempting to retry a `SUCCESS` payment.
- `shouldCancelPendingPayment`: Verifies cancelling an eligible `PENDING` payment.
- `shouldRejectCancellationOfSuccessPayment`: Verifies cancelling a `SUCCESS` payment is blocked.

#### `DashboardServiceTest.java` (2 Tests)
- `shouldCalculateSummaryMetricsAccurately`: Tests real-time aggregation of total volume, success rate percentage, and average transaction amount.
- `shouldReturnRecentPayments`: Validates retrieval of latest transactions mapped to response DTOs.

### 3.2 Gateway Unit Tests (`com.payflow.paymentgateway`)

#### `MockPaymentGatewayTest.java` (4 Tests)
- `shouldProcessNormalPaymentSuccessfully`: Verifies normal charges return success with reference `pg_tx_...`.
- `shouldDeclineWhenForceFailureEnabled`: Verifies simulation toggle rejects transactions with clear error messages.
- `shouldDeclineWhenAmountExceedsLimit`: Verifies charges $\ge \$10,000$ trigger velocity threshold decline.
- `shouldDeclineWhenKeyContainsFailTag`: Verifies explicit test tags trigger mock failure for QA automation.

### 3.3 Controller Integration Tests (`com.payflow.controller`)

#### `AuthControllerIntegrationTest.java` (3 Tests)
- `shouldLoginSuccessfullyWithAdminAccount`: Submits seeded credentials (`admin` / `admin123`) to `/api/auth/login`; verifies HTTP 200 and signed JWT token.
- `shouldRejectInvalidCredentials`: Submits incorrect password; verifies HTTP 401 Unauthorized with sanitized error response.
- `shouldRegisterNewUserSuccessfully`: Registers new user, retrieves JWT token, and accesses protected `/api/auth/me`.

#### `CustomerControllerIntegrationTest.java` (2 Tests)
- `shouldCreateAndRetrieveCustomer`: Tests `POST /api/customers`, retrieves by ID, and patches account status to `INACTIVE`.
- `shouldRejectInvalidEmailFormat`: Submits malformed email string; verifies HTTP 400 Bad Request with field-level validation errors.

#### `PaymentControllerIntegrationTest.java` (2 Tests)
- `shouldCreatePaymentAndEnforceIdempotency`:
  1. Submits initial payment; verifies `201 Created` and status `SUCCESS`.
  2. Submits exact duplicate; verifies `201 Created` returns identical payment ID.
  3. Submits same key with altered amount; verifies `409 Conflict` (`Idempotency Conflict`).
  4. Retrieves complete detail with attempt log and audit trail via `GET /api/payments/{id}/detail`.
- `shouldRejectPaymentForInactiveCustomer`: Verifies customer ID 4 (David Chen - `INACTIVE` in seed data) is rejected with `400 Bad Request`.

---

## 4. Frontend Test Suite Breakdown (8 Tests)

### `StatusBadge.test.jsx` (4 Tests)
- Verifies rendering of `SUCCESS` badge with green indicator and `.badge-success` class.
- Verifies rendering of `FAILED` badge with red indicator and `.badge-failed` class.
- Verifies rendering of `PENDING` badge with amber indicator and `.badge-pending` class.
- Verifies null safety when status prop is empty.

### `Pagination.test.jsx` (2 Tests)
- Verifies page number display, total items count, and previous/next event dispatching.
- Verifies disabling of the "Previous" button on page index 0.

### `ConfirmDialog.test.jsx` (2 Tests)
- Verifies modal rendering of title, warning message, confirm button click, and cancel button dismiss.
- Verifies modal remains unmounted when `isOpen = false`.

---

## 5. Test Execution Commands

### Backend Tests
Execute within `PayFlow/backend/`:

```powershell
# Run entire test suite (Unit & Integration)
mvn test

# Run a specific test class
mvn test -Dtest=PaymentServiceTest

# Run only unit tests
mvn test -Dtest=CustomerServiceTest,PaymentServiceTest,MockPaymentGatewayTest,DashboardServiceTest

# Run only integration tests
mvn test -Dtest=AuthControllerIntegrationTest,CustomerControllerIntegrationTest,PaymentControllerIntegrationTest
```

### Frontend Tests
Execute within `PayFlow/frontend/`:

```powershell
# Run Vitest test runner
npm test

# Run Vitest with coverage report
npm test -- --coverage
```

### Production Build Verification
```powershell
# Verify backend JAR package build
mvn clean package -DskipTests

# Verify frontend Vite production bundle build
npm run build
```
