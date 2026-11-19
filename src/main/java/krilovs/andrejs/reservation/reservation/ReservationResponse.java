package krilovs.andrejs.reservation.reservation;

import java.time.LocalDate;

public record ReservationResponse(Short tableNumber, LocalDate date, String phone, String firstName, String lastName) {
}
