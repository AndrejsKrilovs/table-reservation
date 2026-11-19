package krilovs.andrejs.reservation.reservation;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/** Тело POST /api/v1/reservations. Ограничения длины совпадают с колонками Customer. */
public record ReservationRequest(
        @NotNull @Min(1) @Max(10) Short tableNumber,
        @NotNull @FutureOrPresent LocalDate date,
        @NotBlank @Size(max = 8) String phone,
        @NotBlank @Size(max = 20) String firstName,
        @NotBlank @Size(max = 20) String lastName) {
}
