package krilovs.andrejs.reservation.reservation;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

/** Параметры DELETE /api/v1/reservations/{phone}/{date}. Длина телефона совпадает с Customer. */
public record ReservationCancelRequest(
        @NotBlank(message = "Укажите телефон")
        @Size(min = 8, max = 8, message = "Телефон должен состоять из 8 символов") String phone,
        @NotNull(message = "Выберите дату") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
}
