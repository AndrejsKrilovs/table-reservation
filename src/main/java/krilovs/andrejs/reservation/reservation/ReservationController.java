package krilovs.andrejs.reservation.reservation;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

/**
 * GET /api/v1/reservations?date=2026-11-20 - брони на выбранную дату
 * POST /api/v1/reservations - создать бронь (новый клиент регистрируется автоматически)
 * DELETE /api/v1/reservations/{phone}/{date} - отменить брони клиента на дату, например /20000000/2026-11-20
 * Ошибки превращает в JSON {@link krilovs.andrejs.reservation.config.ApiExceptionHandler}.
 */
@RestController
@RequestMapping("/reservations")
@RequiredArgsConstructor
public class ReservationController {
    private final ReservationService reservations;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReservationResponse book(@Valid @RequestBody ReservationRequest request) {
        return reservations.book(request.tableNumber(), request.date(),
                request.phone(), request.firstName(), request.lastName());
    }

    @GetMapping
    public List<Short> reservedTables(@RequestParam(required = false)
                                      @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return reservations.showReservedTables(Objects.requireNonNullElseGet(date, LocalDate::now));
    }

    @DeleteMapping("/{phone}/{date}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelByPhone(@Valid ReservationCancelRequest request) {
        reservations.cancelByPhone(request.phone(), request.date());
    }
}
