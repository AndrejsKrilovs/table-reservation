package krilovs.andrejs.reservation.admin;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import krilovs.andrejs.reservation.reservation.ReservationResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
public class AdminService {
    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public Map<LocalDate, List<ReservationResponse>> showReservations(LocalDate start, LocalDate end) {
        var statement = """
            select r.id.tableNumber, r.id.reservationDate, c.phone, c.firstName, c.lastName
            from TableReservation r
            join r.customer c
            where r.id.reservationDate between :start and :end
            group by r.id.reservationDate, r.id.tableNumber, c.phone, c.firstName, c.lastName
        """;
        return em.createQuery(statement, ReservationResponse.class)
                .setParameter("start", start)
                .setParameter("end", end)
                .getResultStream()
                .sorted(Comparator.comparing(ReservationResponse::tableNumber))
                .collect(Collectors.groupingBy(ReservationResponse::date, TreeMap::new, Collectors.toList()));
    }
}
