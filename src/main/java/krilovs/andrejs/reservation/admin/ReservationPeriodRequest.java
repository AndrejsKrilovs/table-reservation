package krilovs.andrejs.reservation.admin;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.Objects;

/** Параметры GET /api/v1/admin?start=2026-11-21&end=2026-12-21: период включительно. */
public record ReservationPeriodRequest(
        @NotNull(message = "Укажите начало периода") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
        @NotNull(message = "Укажите конец периода") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {


    @SuppressWarnings("unused")
    @AssertTrue(message = "Конец периода не может быть раньше начала")
    public boolean isPeriodValid() {
        return Objects.isNull(start) || Objects.isNull(end) || !end.isBefore(start);
    }
}
