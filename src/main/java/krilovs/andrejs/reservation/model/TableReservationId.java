package krilovs.andrejs.reservation.model;

import jakarta.persistence.Embeddable;

import java.time.LocalDate;

@Embeddable
public record TableReservationId(Short tableNumber, LocalDate reservationDate) {}
