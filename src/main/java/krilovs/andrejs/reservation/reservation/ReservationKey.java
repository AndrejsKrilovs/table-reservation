package krilovs.andrejs.reservation.reservation;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

/** Ключ брони из пути DELETE /api/v1/reservations/{tableNumber}/{date}. */
public record ReservationKey(
        @NotNull @Min(1) @Max(10) Short tableNumber,
        @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
}
