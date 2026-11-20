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
        @NotNull(message = "Выберите стол")
        @Min(value = 1, message = "Номер стола от 1 до 10")
        @Max(value = 10, message = "Номер стола от 1 до 10") Short tableNumber,
        @NotNull(message = "Выберите дату")
        @FutureOrPresent(message = "Дата не может быть в прошлом") LocalDate date,
        @NotBlank(message = "Укажите телефон")
        @Size(min = 8, max = 8, message = "Телефон должен состоять из 8 символов") String phone,
        @NotBlank(message = "Укажите имя")
        @Size(max = 20, message = "Имя не длиннее 20 символов") String firstName,
        @NotBlank(message = "Укажите фамилию")
        @Size(max = 20, message = "Фамилия не длиннее 20 символов") String lastName) {
}
