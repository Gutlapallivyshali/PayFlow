package com.payflow.repository;

import com.payflow.entity.Payment;
import com.payflow.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByIdempotencyKey(String idempotencyKey);

    boolean existsByIdempotencyKey(String idempotencyKey);

    boolean existsByCustomerId(Long customerId);

    Page<Payment> findByCustomerId(Long customerId, Pageable pageable);

    @Query("SELECT p FROM Payment p JOIN p.customer c WHERE " +
           "(:status IS NULL OR p.status = :status) AND " +
           "(:startDateTime IS NULL OR p.createdAt >= :startDateTime) AND " +
           "(:endDateTime IS NULL OR p.createdAt <= :endDateTime) AND " +
           "(:keyword IS NULL OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.idempotencyKey) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.gatewayReference) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(c.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(c.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Payment> searchPayments(
            @Param("keyword") String keyword,
            @Param("status") PaymentStatus status,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime,
            Pageable pageable
    );

    long countByStatus(PaymentStatus status);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = :status")
    BigDecimal sumAmountByStatus(@Param("status") PaymentStatus status);

    @Query("SELECT COALESCE(AVG(p.amount), 0) FROM Payment p WHERE p.status = :status")
    BigDecimal avgAmountByStatus(@Param("status") PaymentStatus status);

    List<Payment> findTop10ByOrderByCreatedAtDesc();

    @Query("SELECT p FROM Payment p WHERE p.createdAt >= :since ORDER BY p.createdAt ASC")
    List<Payment> findPaymentsSince(@Param("since") LocalDateTime since);
}
