package com.payflow.enums;

public enum PaymentStatus {
    CREATED,
    PENDING,
    SUCCESS,
    FAILED,
    CANCELLED;

    /**
     * Checks if transitioning from this status to targetStatus is logically permitted.
     */
    public boolean canTransitionTo(PaymentStatus targetStatus) {
        if (this == targetStatus) {
            return true;
        }

        switch (this) {
            case CREATED:
                return targetStatus == PENDING || targetStatus == CANCELLED;
            case PENDING:
                return targetStatus == SUCCESS || targetStatus == FAILED || targetStatus == CANCELLED;
            case FAILED:
                // A failed payment can only transition back to PENDING when a valid retry operation is executed
                return targetStatus == PENDING;
            case SUCCESS:
                // Terminal state: A successful payment cannot be altered or degraded
                return false;
            case CANCELLED:
                // Terminal state
                return false;
            default:
                return false;
        }
    }

    public boolean isTerminal() {
        return this == SUCCESS || this == CANCELLED;
    }
}
