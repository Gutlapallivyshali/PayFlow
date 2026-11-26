# PayFlow Comprehensive Engineering & CS Learning Roadmap

Welcome to the **PayFlow Learning Roadmap**! This guide is organized into 20 structured, progressive lessons designed for Computer Science students and software engineering candidates preparing for Software Development Engineer (SDE) internships and full-time interviews.

Each topic breaks down:
1. **What it means** (Conceptual foundation)
2. **Why it is required** (Real-world architectural justification)
3. **Which files to study** (Actual files in this codebase)
4. **How the code works** (Step-by-step walkthrough)
5. **Hands-on exercise** (Practical challenge to test your understanding)
6. **Key SDE interview questions** (Frequently asked interview questions with model answers)

---

## Roadmap Index

1. [Project Structure & Modular Monolith](#1-project-structure--modular-monolith)
2. [Java & Object-Oriented Principles in Practice](#2-java--object-oriented-principles-in-practice)
3. [The Customer Entity & Domain Modeling](#3-the-customer-entity--domain-modeling)
4. [Spring Data JPA Repositories](#4-spring-data-jpa-repositories)
5. [The Service Layer & Business Logic Orchestration](#5-the-service-layer--business-logic-orchestration)
6. [REST Controllers & Request Routing](#6-rest-controllers--request-routing)
7. [Data Transfer Objects (DTOs) & Bean Validation](#7-data-transfer-objects-dtos--bean-validation)
8. [RESTful API Design & HTTP Status Codes](#8-restful-api-design--http-status-codes)
9. [PostgreSQL & Relational Database Design](#9-postgresql--relational-database-design)
10. [JPA Relationships & Cascade Integrity](#10-jpa-relationships--cascade-integrity)
11. [Payment Lifecycle & State Machines](#11-payment-lifecycle--state-machines)
12. [Database Transactions & ACID Boundaries](#12-database-transactions--acid-boundaries)
13. [Idempotency & Preventing Double Charges](#13-idempotency--preventing-double-charges)
14. [Concurrency Control & Optimistic Locking](#14-concurrency-control--optimistic-locking)
15. [Payment Gateway Abstraction & Mock Simulation](#15-payment-gateway-abstraction--mock-simulation)
16. [Authentication, Password Hashing & JWT](#16-authentication-password-hashing--jwt)
17. [React 18 Frontend Architecture](#17-react-18-frontend-architecture)
18. [Frontend-Backend API Integration](#18-frontend-backend-api-integration)
19. [Automated Testing: Unit & Integration](#19-automated-testing-unit--integration)
20. [System Design & Scaling to 10,000 TPS](#20-system-design--scaling-to-10000-tps)

---

## 1. Project Structure & Modular Monolith

### What it means
A **Modular Monolith** is a software architecture where all code runs inside a single deployable artifact (one Spring Boot JAR), but is strictly segmented into well-defined, loosely coupled domain packages.

### Why it is required
Starting with microservices adds massive operational overhead (network hops, distributed tracing, Kubernetes, eventual consistency). A modular monolith gives you high developer velocity, easy end-to-end testing, and clean boundaries that can later be split into microservices when team size or traffic demands it.

### Which files to study
- `backend/src/main/java/com/payflow/`
- `backend/pom.xml`
- `docker-compose.yml`

### How the code works
- `backend/`: Contains Java 17, Spring Boot, Spring Security, Flyway migrations, and tests.
- `frontend/`: Contains the React 18 / Vite SPA console.
- `docs/`: Comprehensive technical architecture and database designs.
- `docker-compose.yml`: Coordinates PostgreSQL, backend JAR, and frontend Nginx container.

### Hands-on Exercise
Open `backend/pom.xml`. Identify which starters provide Spring Web, Data JPA, Security, and Validation. Notice why `com.h2database:h2` is included alongside `org.postgresql:postgresql`.

### Interview Questions
- **Q:** *Why would you choose a modular monolith over microservices for a new payment platform?*
  **A:** A modular monolith provides single-process performance, ACID transactions across tables, and simple deployment while avoiding distributed transactions (2PC/Saga). It allows establishing correct domain boundaries before distributing them.

---

## 2. Java & Object-Oriented Principles in Practice

### What it means
Object-Oriented Programming (OOP) uses encapsulation, abstraction, inheritance, and polymorphism to model real-world business domains cleanly.

### Why it is required
In financial software, mixing business rules (e.g. card fee calculation or status transitions) across arbitrary utility methods leads to catastrophic bugs. OOP encapsulates data and the methods that operate on that data.

### Which files to study
- `backend/src/main/java/com/payflow/entity/Customer.java`
- `backend/src/main/java/com/payflow/enums/PaymentStatus.java`
- `backend/src/main/java/com/payflow/paymentgateway/PaymentGateway.java`

### How the code works
Notice how `PaymentStatus.java` is not just an enum of names—it encapsulates the state machine logic in `canTransitionTo(PaymentStatus targetStatus)`. The state transition rules live inside the enum itself, demonstrating rich domain modeling.

### Hands-on Exercise
Inspect `PaymentStatus.java`. Trace what happens if someone attempts to transition a payment directly from `CREATED` to `SUCCESS` without passing through `PENDING`.

### Interview Questions
- **Q:** *How does PayFlow demonstrate the Open/Closed Principle (OCP)?*
  **A:** Through the `PaymentGateway` interface. The `PaymentService` is closed for modification, but open for extension: new gateways (Stripe, Adyen) can be added without altering existing payment processing code.

---

## 3. The Customer Entity & Domain Modeling

### What it means
A domain entity represents a persistent business object with a distinct identity that persists across time and state changes.

### Why it is required
Customers represent account holders. In payment systems, customers cannot be casually deleted because their IDs are referenced by historical financial audit records.

### Which files to study
- `backend/src/main/java/com/payflow/entity/Customer.java`
- `backend/src/main/java/com/payflow/enums/CustomerStatus.java`

### How the code works
- Uses JPA annotations `@Entity`, `@Table(name = "customers")`.
- `@PrePersist` and `@PreUpdate` automatically manage `createdAt` and `updatedAt` timestamps.
- `isActive()` helper method centralizes the eligibility check.

### Hands-on Exercise
Add a new business method `boolean canInitiatePayments()` to `Customer.java` that checks both `status == CustomerStatus.ACTIVE` and ensures email is present.

### Interview Questions
- **Q:** *Why should you never use database IDs for business logic comparisons before entity persistence?*
  **A:** Because before an entity is saved, its `@GeneratedValue` ID is `null`. Equality (`equals`/`hashCode`) should rely on business keys (such as email or UUID) or identity only after persistence.

---

## 4. Spring Data JPA Repositories

### What it means
Spring Data JPA provides an abstraction layer over Hibernate/JPA, automatically generating data access queries from interface method names or `@Query` JPQL declarations.

### Why it is required
Writing manual JDBC boilerplate (`Connection`, `PreparedStatement`, `ResultSet` mapping) is error-prone, verbose, and vulnerable to SQL injection if string concatenation is accidentally used.

### Which files to study
- `backend/src/main/java/com/payflow/repository/CustomerRepository.java`
- `backend/src/main/java/com/payflow/repository/PaymentRepository.java`

### How the code works
Inspect `searchPayments(...)` in `PaymentRepository.java`:
```java
@Query("SELECT p FROM Payment p JOIN p.customer c WHERE " +
       "(:status IS NULL OR p.status = :status) AND ...")
Page<Payment> searchPayments(...);
```
Spring Data dynamically binds parameters, generates parameterized SQL, and handles pagination counting via `Pageable`.

### Hands-on Exercise
Write a query in `PaymentRepository.java` to find the total sum of payments processed for a given customer ID:
`BigDecimal sumAmountByCustomerId(@Param("customerId") Long customerId);`

### Interview Questions
- **Q:** *What is the N+1 select problem in JPA, and how does PayFlow avoid it?*
  **A:** When fetching an entity with lazy relationships, accessing the relation in a loop executes N additional queries. PayFlow uses `JOIN` and DTO projection in repository queries to fetch customer data along with payments in a single query.

---

## 5. The Service Layer & Business Logic Orchestration

### What it means
The service layer contains the application's business logic, coordinating repositories, security contexts, gateway calls, and audit logging.

### Why it is required
Controllers should only handle HTTP concerns; repositories should only handle data persistence. The service layer is where business validation, transaction boundaries, and state transitions live.

### Which files to study
- `backend/src/main/java/com/payflow/service/PaymentService.java`
- `backend/src/main/java/com/payflow/service/CustomerService.java`

### How the code works
Open `PaymentService.createAndProcessPayment(...)`:
1. Resolves and checks the idempotency key.
2. Validates customer active status.
3. Inserts payment in `CREATED` state.
4. Transitions state to `PENDING` and writes audit log.
5. Calls `paymentGateway.processPayment(...)`.
6. Inserts `PaymentAttempt`.
7. Transitions state to `SUCCESS` or `FAILED` and writes final audit log.

### Hands-on Exercise
In `PaymentService.java`, trace the `retryPayment(Long id, String username)` method and verify why only `FAILED` payments can be retried.

### Interview Questions
- **Q:** *Why should external network calls (like payment gateways) ideally be handled carefully inside database transactions?*
  **A:** Holding a database connection open while waiting for an external HTTP network response can exhaust the database connection pool (HikariCP) under high traffic. In high-scale systems, this is decomposed using asynchronous workers.

---

## 6. REST Controllers & Request Routing

### What it means
Spring MVC `@RestController` classes expose HTTP endpoints, map incoming URLs and JSON request bodies, and return structured HTTP responses.

### Why it is required
They provide the standardized REST interface that web clients, mobile apps, and third-party partners use to communicate with PayFlow.

### Which files to study
- `backend/src/main/java/com/payflow/controller/PaymentController.java`
- `backend/src/main/java/com/payflow/controller/CustomerController.java`

### How the code works
Notice how `PaymentController` uses `@RequestHeader(value = "Idempotency-Key", required = false)` to extract headers, `@Valid` to trigger Bean Validation, and `Principal` to automatically identify the authenticated user.

### Hands-on Exercise
Add a new endpoint `GET /api/customers/count` in `CustomerController.java` that returns the total count of active customers.

### Interview Questions
- **Q:** *What is the difference between `@RequestParam`, `@PathVariable`, and `@RequestBody` in Spring MVC?*
  **A:** `@PathVariable` extracts values from the URL path (`/api/payments/{id}`). `@RequestParam` extracts query string parameters (`/api/payments?status=SUCCESS`). `@RequestBody` deserializes the JSON body into a Java DTO.

---

## 7. Data Transfer Objects (DTOs) & Bean Validation

### What it means
DTOs are plain Java objects designed solely to carry data between processes (client and server), decoupled from internal database entity schemas.

### Why it is required
Directly exposing database entities can cause:
1. Mass-assignment vulnerabilities (client modifies `version` or `id`).
2. Infinite recursion during JSON serialization with bidirectional JPA relations.
3. Inability to validate client input before database interaction.

### Which files to study
- `backend/src/main/java/com/payflow/dto/request/CreatePaymentRequest.java`
- `backend/src/main/java/com/payflow/dto/response/PaymentResponse.java`

### How the code works
In `CreatePaymentRequest.java`:
```java
@NotNull(message = "Payment amount is required")
@DecimalMin(value = "0.01", message = "Amount must be greater than zero")
@Digits(integer = 12, fraction = 2, message = "Amount format must have at most 12 integer digits and 2 decimals")
private BigDecimal amount;
```
If a client sends an amount of `-5.00`, Spring's validation triggers `MethodArgumentNotValidException`, which `GlobalExceptionHandler` converts into a structured 400 Bad Request before any business code runs.

### Hands-on Exercise
Add a `@Size(min = 3, max = 255)` constraint to `description` in `CreatePaymentRequest.java`.

### Interview Questions
- **Q:** *What happens when `@Valid` fails on a controller method argument?*
  **A:** Spring throws `MethodArgumentNotValidException` containing a `BindingResult` with all field validation errors.

---

## 8. RESTful API Design & HTTP Status Codes

### What it means
REST (Representational State Transfer) is an architectural style using standard HTTP verbs (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) and standard semantic status codes.

### Why it is required
Clear status codes allow frontend applications and API clients to programmatically react to successes, validation errors, auth failures, and conflicts without parsing message strings.

### Which files to study
- `backend/src/main/java/com/payflow/controller/CustomerController.java`
- `backend/src/main/java/com/payflow/exception/GlobalExceptionHandler.java`

### How the code works
- `POST /api/customers` -> returns `201 Created`
- `DELETE /api/customers/{id}` -> returns `204 No Content`
- Attempting to submit a conflicting idempotency key -> returns `409 Conflict`
- Invalid state transition (e.g. cancelling a successful payment) -> returns `422 Unprocessable Entity`

### Hands-on Exercise
Look at `GlobalExceptionHandler.java`. Identify which exception triggers HTTP 404, HTTP 409, and HTTP 422.

### Interview Questions
- **Q:** *When should you return 400 Bad Request vs 422 Unprocessable Entity vs 409 Conflict?*
  **A:**
  - `400 Bad Request`: Malformed syntax, invalid JSON, or failed bean validation constraints.
  - `409 Conflict`: Resource collision (duplicate email, duplicate idempotency key with conflicting payload).
  - `422 Unprocessable Entity`: Syntactically valid request, but domain state machine forbids the action (e.g. retrying a payment that is already `SUCCESS`).

---

## 9. PostgreSQL & Relational Database Design

### What it means
A relational database organizes data into tables with typed columns, unique keys, and foreign key relationships, guaranteeing ACID properties.

### Why it is required
Financial data requires strict consistency. If an account is debited, the transaction record must commit reliably. NoSQL eventual consistency is unsuitable for core financial ledger balancing.

### Which files to study
- `backend/src/main/resources/db/migration/V1__init_schema.sql`
- `docs/database-design.md`

### How the code works
Inspect `V1__init_schema.sql`. Notice:
1. `BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY` ensures auto-incrementing 64-bit integer keys.
2. `NUMERIC(15, 2)` prevents floating-point inaccuracies.
3. B-Tree indexes on `customer_id`, `status`, and `idempotency_key`.

### Hands-on Exercise
Review the indexes in `V1__init_schema.sql`. Explain why indexing `idempotency_key` is critical for high-throughput payment creation.

### Interview Questions
- **Q:** *Why is `BIGINT` preferred over `INT` for primary keys in payment tables?*
  **A:** A standard 32-bit signed `INT` overflows at $\approx 2.14 \times 10^9$ records. A high-volume payment processor can exceed 2 billion transactions in a few years. `BIGINT` supports up to $9 \times 10^{18}$ records.

---

## 10. JPA Relationships & Cascade Integrity

### What it means
JPA relationships (`@ManyToOne`, `@OneToMany`) map foreign key associations between relational tables and Java object graphs.

### Why it is required
Payments belong to Customers; Attempts belong to Payments. Setting up correct mapping and fetch types is critical for performance and data safety.

### Which files to study
- `backend/src/main/java/com/payflow/entity/Payment.java`
- `backend/src/main/java/com/payflow/entity/PaymentAttempt.java`

### How the code works
In `Payment.java`:
```java
@ManyToOne(fetch = FetchType.LAZY, optional = false)
@JoinColumn(name = "customer_id", nullable = false)
private Customer customer;
```
`FetchType.LAZY` ensures the customer record is not loaded into memory unless explicitly accessed, preventing unnecessary database joins.

### Hands-on Exercise
In `CustomerService.java`, examine `deleteCustomer(Long id)`. Notice how it checks `paymentRepository.existsByCustomerId(id)` to prevent orphan records or foreign key constraint violations.

### Interview Questions
- **Q:** *Why should you avoid `CascadeType.REMOVE` on financial parent entities?*
  **A:** Because deleting a customer must never silently cascade and delete their historical payment records. Financial regulations (SOX, PCI) require keeping transaction audit trails intact.

---

## 11. Payment Lifecycle & State Machines

### What it means
A **Finite State Machine (FSM)** is a behavioral model consisting of a finite number of states, transitions between those states, and actions.

### Why it is required
Without a state machine, race conditions can cause illegal transitions—for example, a failed payment could be erroneously marked successful without running a real retry.

### Which files to study
- `backend/src/main/java/com/payflow/enums/PaymentStatus.java`
- `docs/system-design.md`

### How the code works
The state transitions enforced in `PaymentStatus.java`:
- `CREATED` -> `PENDING` or `CANCELLED`
- `PENDING` -> `SUCCESS`, `FAILED`, or `CANCELLED`
- `FAILED` -> `PENDING` (only via valid retry)
- `SUCCESS` -> Terminal (no transitions permitted)
- `CANCELLED` -> Terminal (no transitions permitted)

### Hands-on Exercise
Open `PaymentServiceTest.java`. Find `shouldRejectRetryOnNonFailedPayment` and see how it tests that a `SUCCESS` payment rejects retry attempts.

### Interview Questions
- **Q:** *Why are terminal states in payment processing irreversible?*
  **A:** Once money has settled upstream with a banking partner (`SUCCESS`), the transaction cannot simply be updated to `FAILED` or `CANCELLED` in the database. Any reversal must be handled through an explicit new transaction (a Refund or Chargeback).

---

## 12. Database Transactions & ACID Boundaries

### What it means
An ACID transaction guarantees:
- **Atomicity:** All operations succeed, or all roll back.
- **Consistency:** Database moves from one valid state to another.
- **Isolation:** Concurrent transactions do not interfere with each other.
- **Durability:** Committed data survives crashes.

### Why it is required
In payment processing, creating a payment, recording the attempt, and writing the audit log must be atomic. A failure in audit logging should not leave orphaned payment records.

### Which files to study
- `backend/src/main/java/com/payflow/service/PaymentService.java`
- `backend/src/main/java/com/payflow/service/AuditService.java`

### How the code works
In `PaymentService.java`, methods are annotated with `@Transactional`. If an unhandled `RuntimeException` is thrown, the Spring transaction manager triggers a database `ROLLBACK`. `AuditService` methods use `propagation = Propagation.REQUIRED` to participate in the caller's transaction.

### Hands-on Exercise
In `PaymentService.java`, observe what happens if `customerRepository.save(...)` fails. Does the audit log persist? (Answer: No, the entire transaction rolls back).

### Interview Questions
- **Q:** *What is the difference between `@Transactional(readOnly = true)` and `@Transactional`?*
  **A:** `readOnly = true` optimizes Hibernate session flushing and tells the JDBC driver not to track entity snapshot changes (dirty checking), improving performance on query methods.

---

## 13. Idempotency & Preventing Double Charges

### What it means
An idempotent endpoint guarantees that receiving the same request multiple times has the exact same effect as receiving it once.

### Why it is required
If a mobile client submits a payment and experiences a 504 Gateway Timeout, the client does not know if the charge succeeded. The client automatically retries. Idempotency guarantees the customer is charged once, not twice.

### Which files to study
- `backend/src/main/java/com/payflow/service/IdempotencyService.java`
- `backend/src/test/java/com/payflow/controller/PaymentControllerIntegrationTest.java`

### How the code works
1. Client generates `Idempotency-Key: idem_abc123`.
2. Database checks unique constraint on `idempotency_key`.
3. If key exists:
   - Check if payload matches: returns existing payment (`PaymentResponse`).
   - If payload differs: throws `IdempotencyConflictException` (409 Conflict).

### Hands-on Exercise
Run `PaymentControllerIntegrationTest.java` and observe the test `shouldCreatePaymentAndEnforceIdempotency`.

### Interview Questions
- **Q:** *How do you handle idempotency conflicts when two identical requests arrive at the exact same millisecond?*
  **A:** Database unique constraints act as the ultimate arbiter. One insert succeeds; the concurrent insert fails with a Unique Constraint Violation, which the application catches and translates into an idempotent retrieval.

---

## 14. Concurrency Control & Optimistic Locking

### What it means
Optimistic locking assumes collisions are rare and verifies that no other transaction modified the record before committing.

### Why it is required
Prevents **Lost Updates**. If two operators view a failed payment at the same time and both click "Retry", optimistic locking ensures only one retry executes, while the second receives a concurrency conflict error.

### Which files to study
- `backend/src/main/java/com/payflow/entity/Payment.java`
- `backend/src/main/java/com/payflow/exception/GlobalExceptionHandler.java`

### How the code works
In `Payment.java`:
```java
@Version
@Column(nullable = false)
private Long version = 0L;
```
Every `UPDATE` issues:
`UPDATE payments SET ..., version = version + 1 WHERE id = ? AND version = ?;`
If `version` does not match, Hibernate throws `ObjectOptimisticLockingFailureException`, which `GlobalExceptionHandler` converts to HTTP 409.

### Hands-on Exercise
Trace how `GlobalExceptionHandler.handleOptimisticLockingFailure(...)` formats its response message.

### Interview Questions
- **Q:** *When would you choose Optimistic Locking over Pessimistic Locking?*
  **A:** Optimistic locking is superior for read-heavy systems with low-to-medium write contention because it avoids physical database row locks, preventing connection pool bottlenecks.

---

## 15. Payment Gateway Abstraction & Mock Simulation

### What it means
The Payment Gateway Abstraction encapsulates external banking APIs behind a standardized Java interface.

### Why it is required
Real banking networks (Visa, Mastercard, UPI, ACH) require specialized SDKs. Decoupling the gateway lets you test business logic with a mock gateway and plug in production gateways later with zero changes to business services.

### Which files to study
- `backend/src/main/java/com/payflow/paymentgateway/PaymentGateway.java`
- `backend/src/main/java/com/payflow/paymentgateway/MockPaymentGateway.java`

### How the code works
`MockPaymentGateway` implements `PaymentGateway`. It simulates realistic network delay (150ms), generates mock transaction references (`pg_tx_...`), and checks configurable failure triggers (e.g. amounts $\ge \$10,000$ fail with velocity limit).

### Hands-on Exercise
Open `backend/src/main/resources/application.properties`. Change `payflow.gateway.mock.default-latency-ms` to `50` and observe how test execution times change.

### Interview Questions
- **Q:** *What design pattern is used by `PaymentGateway`?*
  **A:** The **Strategy Pattern**. It defines a family of algorithms (different payment gateways), encapsulates each one, and makes them interchangeable at runtime.

---

## 16. Authentication, Password Hashing & JWT

### What it means
- **BCrypt:** A one-way cryptographic hash with salt.
- **JWT (JSON Web Token):** A cryptographically signed token containing verified claims.

### Why it is required
Stateless authentication allows scaling backend instances horizontally without sticky sessions or shared session databases.

### Which files to study
- `backend/src/main/java/com/payflow/security/JwtTokenProvider.java`
- `backend/src/main/java/com/payflow/security/JwtAuthenticationFilter.java`
- `backend/src/main/java/com/payflow/security/SecurityConfig.java`

### How the code works
1. Client calls `POST /api/auth/login`.
2. Spring's `AuthenticationManager` verifies the password with `BCryptPasswordEncoder`.
3. `JwtTokenProvider` signs a JWT containing `sub` (username) and `roles`.
4. Subsequent requests include `Authorization: Bearer <token>`.
5. `JwtAuthenticationFilter` intercepts the request, verifies the signature, and sets the `Authentication` in Spring's `SecurityContextHolder`.

### Hands-on Exercise
In `JwtTokenProvider.java`, examine how `Jwts.parser().verifyWith(key).build()` parses and verifies tokens.

### Interview Questions
- **Q:** *Why is BCrypt resistant to GPU brute-forcing compared to SHA-256?*
  **A:** BCrypt is memory-hard and computationally configurable. Its internal Blowfish key schedule requires significant memory and CPU cycles per iteration, severely limiting parallel GPU cracking.

---

## 17. React 18 Frontend Architecture

### What it means
A modern Single Page Application (SPA) built with React 18, React Router 6, and Vite, managing user interface state client-side.

### Why it is required
Provides an interactive, low-latency dashboard experience for viewing real-time transaction graphs, inspecting audit trails, and executing payments without full-page browser reloads.

### Which files to study
- `frontend/src/App.jsx`
- `frontend/src/layouts/MainLayout.jsx`
- `frontend/src/pages/DashboardPage.jsx`
- `frontend/src/pages/CreatePaymentPage.jsx`

### How the code works
- `App.jsx`: Sets up client routes (`/login`, `/customers`, `/payments`, `/settings`).
- `MainLayout.jsx`: Wraps protected routes with `Sidebar` and `Navbar`, redirecting unauthenticated visitors to `/login`.
- `AuthContext.jsx`: Provides authentication state (`user`, `login`, `logout`) via React Context.

### Hands-on Exercise
Open `frontend/src/components/StatusBadge.jsx`. Add a new status color for `SUSPENDED` accounts.

### Interview Questions
- **Q:** *How does React Router 6 protect private routes from unauthenticated access?*
  **A:** By using a Layout wrapper component (`MainLayout`) that checks `isAuthenticated`. If false, it renders `<Navigate to="/login" replace />`.

---

## 18. Frontend-Backend API Integration

### What it means
Connecting React client components to Spring Boot REST endpoints using an Axios HTTP client.

### Why it is required
Frontend forms must transmit JSON payloads, receive responses, attach JWT bearer tokens, and handle backend validation errors gracefully.

### Which files to study
- `frontend/src/services/api.js`
- `frontend/src/services/paymentService.js`
- `frontend/src/pages/CreatePaymentPage.jsx`

### How the code works
In `api.js`:
An Axios request interceptor automatically reads `localStorage.getItem('payflow_token')` and appends `headers.Authorization = 'Bearer ' + token`. A response interceptor intercepts 401 Unauthorized responses and redirects the user to the login page.

### Hands-on Exercise
In `CreatePaymentPage.jsx`, examine how the `Idempotency-Key` is generated using a timestamp and random string.

### Interview Questions
- **Q:** *How should a frontend handle an HTTP 409 Conflict when an idempotency key is reused with a different amount?*
  **A:** The frontend should intercept the 409 response and display an error alert explaining that the idempotency key was previously submitted for a different amount, prompting the user to generate a new key.

---

## 19. Automated Testing: Unit & Integration

### What it means
- **Unit Tests:** Test classes in isolation using Mockito mocks.
- **Integration Tests:** Test the entire application stack with `MockMvc` and an in-memory database.

### Why it is required
Financial software must have zero regressions. Tests prove that state transitions, idempotency rules, and security checks function as expected on every code change.

### Which files to study
- `backend/src/test/java/com/payflow/service/PaymentServiceTest.java`
- `backend/src/test/java/com/payflow/controller/PaymentControllerIntegrationTest.java`
- `frontend/src/test/StatusBadge.test.jsx`

### How the code works
In `PaymentServiceTest.java`:
Mockito mocks `PaymentRepository` and `PaymentGateway`. We test business rules (e.g. `shouldRejectPaymentForInactiveCustomer`) in milliseconds without spinning up a real server.

### Hands-on Exercise
Run `mvn test` in `backend/` and verify that all 30 tests pass.

### Interview Questions
- **Q:** *What is the difference between `@Mock` and `@MockBean`?*
  **A:** `@Mock` is a standard Mockito annotation used in unit tests without Spring. `@MockBean` is a Spring Boot Test annotation that places a mock into the Spring `ApplicationContext`, replacing any existing bean of the same type.

---

## 20. System Design & Scaling to 10,000 TPS

### What it means
Designing distributed architectures that handle high transaction velocity, network partitions, and hardware failures.

### Why it is required
SDE interviews frequently ask candidates to explain how their monolithic project could scale to handle global transaction volume (e.g. Black Friday traffic).

### Which files to study
- `docs/system-design.md`
- `docker-compose.yml`

### How to Answer in an Interview
1. **Asynchronous Decoupling:** Introduce **Apache Kafka** between payment submission and payment gateway execution. Return `202 Accepted` to the client immediately.
2. **Distributed Idempotency:** Use **Redis** with atomic `SETNX` commands for sub-2ms idempotency checks before querying the database.
3. **Database Sharding:** Shard the `payments` table by `customer_id` or `country_code` across multiple PostgreSQL clusters.
4. **Resilience:** Wrap external payment gateway calls with **Resilience4j Circuit Breakers** to fail fast when downstream banking networks experience outages.

### Hands-on Exercise
Read Section 8 in `docs/system-design.md`. Draw a diagram showing how Kafka and Redis would sit between the client and the payment engine.

### Interview Questions
- **Q:** *How do you prevent the dual-write problem when saving a payment to a database and publishing an event to Kafka?*
  **A:** Use the **Transactional Outbox Pattern**. Save the payment and an outbox event in the same database transaction. A separate process (like Debezium CDC) tails the database transaction log and publishes the event to Kafka guaranteed.
