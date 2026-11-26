# PayFlow Security Architecture & Threat Model

## 1. Security Overview

PayFlow implements industry-standard application security patterns designed to protect financial transactions, user credentials, and operational endpoints.
- **Stateless Authentication:** JSON Web Tokens (JWT) signed with HMAC-SHA256.
- **Cryptographic Password Hashing:** Adaptive BCrypt hashing with salt.
- **Role-Based Authorization (RBAC):** Hierarchical permissions (`ROLE_ADMIN`, `ROLE_CUSTOMER`).
- **Input Validation & Sanitization:** Boundary Bean Validation (`@Valid`) preventing SQL injection and parameter manipulation.
- **Cross-Origin Security (CORS):** Strict header exposures (`Idempotency-Key`, `Authorization`).

---

## 2. Authentication & Filter Chain Architecture

The diagram below illustrates how incoming HTTP requests are authenticated before reaching business controllers:

```mermaid
sequenceDiagram
    autonumber
    actor Client as Frontend Client
    participant CORS as CorsFilter
    participant JWT as JwtAuthenticationFilter
    participant Provider as JwtTokenProvider
    participant Details as CustomUserDetailsService
    participant Context as SecurityContextHolder
    participant Endpoint as Protected REST Controller

    Client->>CORS: HTTP Request with Headers
    CORS-->>Client: Process CORS & Preflight (OPTIONS)
    
    CORS->>JWT: Request with Header "Authorization: Bearer <token>"
    alt Bearer Token Missing or Public Route (/api/auth/**, /swagger-ui/**)
        JWT->>Endpoint: Pass request down chain
    else Bearer Token Present
        JWT->>Provider: validateToken(token)
        alt Token Signature or Expiry Invalid
            Provider-->>JWT: Invalid Token
            JWT->>Endpoint: Context remains unauthenticated
            Note over Endpoint: Spring Security returns 401 Unauthorized
        else Token Valid
            Provider->>JWT: Extract Username (claims.getSubject())
            JWT->>Details: loadUserByUsername(username)
            Details-->>JWT: UserDetails (Username, Authorities e.g. ROLE_ADMIN)
            JWT->>Context: setAuthentication(UsernamePasswordAuthenticationToken)
            JWT->>Endpoint: Proceed to Controller with Authenticated Principal
        end
    end
```

---

## 3. Password Hashing with BCrypt

### Why Plaintext or MD5/SHA-256 Passwords Fail
- **Plaintext:** Completely exposes user accounts during database leaks.
- **Fast Hashes (MD5, SHA-1, standard SHA-256):** Vulnerable to **Rainbow Table attacks** (precomputed hash dictionaries) and massive hardware brute-forcing. A modern GPU can compute billions of SHA-256 hashes per second.

### The BCrypt Algorithm
PayFlow uses `BCryptPasswordEncoder` configured via Spring Security:
1. **Cryptographic Salting:** For every user registration, BCrypt generates a random 16-byte salt:
   $$\text{Salt} \xrightarrow{\quad} \text{Unique per user}$$
   Even if two users share the exact same password (`admin123`), their stored hashes are completely different, defeating rainbow tables.
2. **Adaptive Cost Factor:** BCrypt incorporates a configurable work factor ($2^{\text{cost}}$ iterations). PayFlow uses cost factor $10$ ($2^{10} = 1024$ rounds of Blowfish key expansion).
3. **Storage Format:**
   ```
   $2a$10$wK1Wv9zVbVbK7lK9jX2q7.8Z0fE9z0d5x0c7v8b9a1s2d3f4g5h6j
   ├──┘ ├──┘ ├─────────────────────┤├──────────────────────────┤
   Alg  Cost       22-char Salt              31-char Hash
   ```

---

## 4. JSON Web Token (JWT) Implementation

PayFlow issues signed JWT tokens using the modern `jjwt` 0.12.5 library.

### Token Structure
A JWT consists of three Base64URL-encoded segments separated by dots:
$$\text{Header} \ .\ \text{Payload} \ .\ \text{Signature}$$

1. **Header:** Identifies the signing algorithm and token type:
   ```json
   {
     "alg": "HS256",
     "typ": "JWT"
   }
   ```
2. **Payload (Claims):** Contains the identity subject and authorization claims:
   ```json
   {
     "sub": "admin",
     "roles": "ROLE_ADMIN",
     "iat": 1732210000,
     "exp": 1732296400
   }
   ```
3. **Signature:** Computed using HMAC-SHA256 with the server's private secret key:
   $$\text{Signature} = \text{HMACSHA256}(\text{Header} + "." + \text{Payload}, \ \text{SecretKey})$$

### Stateless Verification
- The server does **not** store active tokens in a database session table.
- When an API request arrives, `JwtTokenProvider` validates the mathematical signature against the server's private key and verifies that `exp` is in the future.
- If an attacker tampers with the payload (e.g. changing `roles: "CUSTOMER"` to `ROLE_ADMIN`), the signature computation fails immediately, rejecting the request with `401 Unauthorized`.

---

## 5. Role-Based Access Control (RBAC)

PayFlow defines two distinct roles in `UserRole.java`:
- **`ROLE_ADMIN`:** Full platform access: create payments, trigger retries, cancel transactions, toggle mock gateway failure modes, and view all system telemetry.
- **`ROLE_CUSTOMER`:** Standard account access: initiate payments for their own account and inspect their personal payment history.

### Method Security
Spring Security's `@EnableMethodSecurity` allows declarative endpoint protection:
```java
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<Map<String, Object>> toggleFailure(...) { ... }
```

---

## 6. Secrets & Environment Configuration

Secrets are never hardcoded in production source code. PayFlow loads sensitive configuration from environment variables with fallback defaults for local developer execution:

| Secret | Environment Variable | Development Fallback | Production Requirement |
| :--- | :--- | :--- | :--- |
| **JWT Signing Key** | `JWT_SECRET` | 256-bit hex test key | Must be a cryptographically random $\ge 256$-bit secret. |
| **JWT Expiration** | `JWT_EXPIRATION_MS` | `86400000` (24 hours) | Configured based on session policy. |
| **Database Password**| `DB_PASSWORD` | `postgres` | Strong secret injected via Docker secrets or vault. |

---

## 7. Cross-Origin Resource Sharing (CORS)

Cross-origin requests from the React frontend (running on `http://localhost:5173`) are explicitly configured in `SecurityConfig.java`:
- **Allowed Methods:** `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`.
- **Allowed Headers:** `Authorization`, `Content-Type`, `Idempotency-Key`, `X-Requested-With`.
- **Exposed Headers:** `Authorization`, `Idempotency-Key` (allowing frontend clients to inspect transaction headers).
- **Credentials Allowed:** `true`.

---

## 8. Security Limitations & Production Fintech Hardening

Because PayFlow is an educational payment simulation, developers and interviewers should understand the differences between this demo and a real-world PCI-DSS compliant banking gateway:

| Area | PayFlow Demo Implementation | Real-World Financial Production Requirement |
| :--- | :--- | :--- |
| **Card Data Storage** | Mock payment methods only (`MOCK_CARD`, `MOCK_UPI`). Real card numbers are never handled. | **PCI-DSS Level 1 Compliance:** Plaintext PANs/CVVs never touch the application server. Client uses hosted tokenization fields (Stripe Elements / Adyen Drop-in). |
| **Token Invalidation** | Client deletes token on logout. Token expires after TTL. | **Token Blacklisting / Refresh Tokens:** Short-lived access tokens (15m) + revocable refresh tokens stored in secure Redis cache. |
| **Rate Limiting** | Open API endpoints. | **API Gateway Rate Limiting:** Token bucket algorithm (e.g. 100 req/min per IP via Redis / Cloudflare). |
| **Encryption at Rest** | Relational plaintext fields with SSL database connections. | Column-level envelope encryption (AES-256-GCM) with AWS KMS or HashiCorp Vault. |
| **Audit Log Tampering**| PostgreSQL relational audit table. | Cryptographic hashing / append-only write-once-read-many (WORM) storage. |
