package com.payflow.repository;

import com.payflow.entity.PaymentAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentAttemptRepository extends JpaRepository<PaymentAttempt, Long> {
    List<PaymentAttempt> findByPaymentIdOrderByAttemptNumberAsc(Long paymentId);
    long countByPaymentId(Long paymentId);
}
