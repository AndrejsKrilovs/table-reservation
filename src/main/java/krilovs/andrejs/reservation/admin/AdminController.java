package krilovs.andrejs.reservation.admin;

import jakarta.validation.Valid;
import krilovs.andrejs.reservation.reservation.ReservationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.TreeMap;

/**
 * GET /api/v1/admin/reservations?start=2026-11-21&end=2026-12-21 - брони за период (включительно), сгруппированные по дате
 */
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {
    private final AdminService adminService;

    @GetMapping("/reservations")
    public TreeMap<LocalDate, List<ReservationResponse>> showReservations(@Valid ReservationPeriodRequest period) {
        return adminService.showReservations(period.start(), period.end());
    }
}
