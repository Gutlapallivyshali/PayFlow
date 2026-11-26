# PayFlow Architecture Documentation

## 1. Architectural Overview

PayFlow is architected as an **Enterprise Modular Monolith** designed around high-reliability payment processing and strict financial auditability principles. The architecture prioritizes separation of concerns, strong transaction boundaries, idempotency enforcement, and pluggable gateway abstractions.

```
                              ┌──────────────────────────────────┐
                              │     React 18 / Vite Frontend     │
                              │   (Console & Real-Time Client)   │
                              └─────────────────┬────────────────┘
                                                │ HTTPS / REST (JSON)
                                                ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PayFlow Core Backend                                    │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                               Spring Security Filter Chain                        │  │
│  │   - JwtAuthenticationFilter (HMAC-SHA256 Token Extraction & Validation)          │  │
│  │   - Stateless Session Management                                                  │  │
│  │   - Role-Based Access Controls (ADMIN, CUSTOMER)                                  │  │
│  └───────────────────────────────────────────┬──────────────────────────────────────┘  │
│                                              ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                REST Controller Layer                              │  │
│  │   - AuthController          (/api/auth/**)                                       │  │
│  │   - CustomerController      (/api/customers/**)                                  │  │
│  │   - PaymentController       (/api/payments/**)                                   │  │
│  │   - DashboardController     (/api/dashboard/**)                                  │  │
│  │   - GatewayConfigController (/api/gateway/**)                                    │  │
│  │   - GlobalExceptionHandler  (@RestControllerAdvice => Consistent ApiErrorResponse)│  │
│  └───────────────────────────────────────────┬──────────────────────────────────────┘  │
│                                              ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                 Service Layer                                    │  │
│  │   - CustomerService        - PaymentService        - IdempotencyService           │  │
│  │   - AuditService           - DashboardService      - AuthService                  │  │
│  │   -----------------------------------------------------------------------------  │  │
│  │   State Machine Transitions | Concurrency Versioning | Atomic @Transactional     │  │
│  └──────────────────────┬───────────────────────────────────┬───────────────────────┘  │
│                         │                                   │                          │
│                         ▼                                   ▼                          │
│       ┌───────────────────────────────────┐   ┌───────────────────────────────┐        │
│       │     Payment Gateway Abstraction   │   │     Spring Data JPA Repos     │        │
│       │   - PaymentGateway (Interface)    │   │   - CustomerRepository        │        │
│       │   - MockPaymentGateway (Component)│   │   - PaymentRepository         │        │
│       │     (Latency, Failure Simulation) │   │   - PaymentAttemptRepository  │        │
│       └───────────────────────────────────┘   │   - PaymentAuditLogRepository │        │
│                                               │   - UserRepository            │        │
│                                               └──────────────┬────────────────┘        │
└──────────────────────────────────────────────────────────────┼─────────────────────────┘
                                                               ▼
                                                ┌─────────────────────────────┐
                                                │    PostgreSQL Database      │
                                                │  (Managed via Flyway V1, V2)│
                                                └─────────────────────────────┘
```

---

## 2. Controller-Service-Repository Pattern

PayFlow strictly adheres to the 3-Tier Layered Architecture:

### 2.1 Controller Layer (`com.payflow.controller`)
- **Responsibilities:**
  - Exposes RESTful HTTP endpoints conforming to OpenAPI 3.0 standards.
  - Extracts HTTP request payloads, route parameters, and headers (such as `Idempotency-Key` and `Authorization`).
  - Performs bean validation via `@Valid` annotations (`@NotBlank`, `@DecimalMin`, `@Email`).
  - Converts service results into HTTP response entities with accurate status codes (`200 OK`, `201 Created`, `400 Bad Request`, `409 Conflict`, `422 Unprocessable Entity`).
  - Never executes business rules or direct database queries.

### 2.2 Service Layer (`com.payflow.service`)
- **Responsibilities:**
  - Encapsulates all domain logic, transaction boundaries (`@Transactional`), and workflow coordination.
  - Validates business rules (e.g. verifying that a customer is in `ACTIVE` status prior to accepting a payment).
  - Enforces the payment state machine: verifying whether state transitions are permitted.
  - Interacts with `IdempotencyService` to guarantee that duplicate requests are replayed without redundant gateway execution.
  - Dispatches requests to the `PaymentGateway` engine and logs audit entries in `AuditService`.

### 2.3 Repository Layer (`com.payflow.repository`)
- **Responsibilities:**
  - Interfaces with the relational database through Spring Data JPA and Hibernate ORM.
  - Defines indexed queries, pagination (`Pageable`), and custom JPQL aggregate functions for telemetry.
  - Translates SQL constraint violations and optimistic locking exceptions.

---

## 3. Data Transfer Object (DTO) Usage

Entity instances are strictly decoupled from client-facing REST APIs:
1. **Security Isolation:** Entities contain database metadata, version counters (`@Version`), and internal relationships. DTOs expose only client-relevant fields, preventing accidental over-fetching and mass-assignment vulnerabilities.
2. **Request Validation:** Incoming requests (`CreatePaymentRequest`, `CreateCustomerRequest`, `RegisterUserRequest`) enforce constraints at the boundary before any service logic executes.
3. **Response Projection:** Responses (`PaymentResponse`, `CustomerResponse`, `DashboardSummaryResponse`, `PaymentDetailResponse`) present clean, normalized data structures with pre-calculated fields (e.g. customer display names and formatted currency strings).

---

## 4. Module Responsibilities

| Module | Package | Core Functionality |
| :--- | :--- | :--- |
| **Authentication & Security** | `com.payflow.security` | JWT token issuing, BCrypt verification, OncePerRequestFilter authentication, and role authorization. |
| **Customer Management** | `com.payflow.service` | Customer lifecycle, duplicate email prevention, activation/deactivation, and soft retention. |
| **Payment Engine** | `com.payflow.service` | Atomic payment creation, state transition management, retry processing, and cancellation. |
| **Idempotency Guard** | `com.payflow.service` | Request deduplication, payload fingerprint verification, and replay resolution. |
| **Payment Gateway Engine** | `com.payflow.paymentgateway` | Decoupled payment provider contract (`PaymentGateway`) and simulation implementation. |
| **Audit & Telemetry** | `com.payflow.service` | Immutable chronological event logging and real-time dashboard analytics aggregation. |

---

## 5. Dependency Flow Rules

- Dependencies strictly flow **downward**:
  - `Controller` -> `Service` -> `Repository` -> `Database`
  - `Service` -> `PaymentGateway`
- Services never invoke Controllers.
- Entities never depend on Services or Controllers.
- Cross-cutting concerns (Audit logging and Idempotency checking) are modeled as distinct collaborator services injected via standard constructor injection.
