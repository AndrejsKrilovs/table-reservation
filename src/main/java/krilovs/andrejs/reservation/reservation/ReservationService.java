package krilovs.andrejs.reservation.reservation;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import krilovs.andrejs.reservation.model.Customer;
import krilovs.andrejs.reservation.model.TableReservation;
import krilovs.andrejs.reservation.model.TableReservationId;
import org.hibernate.KeyType;
import org.hibernate.Session;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@Service
public class ReservationService {
    @PersistenceContext
    private EntityManager em;

    @Transactional
    public ReservationResponse book(Short tableNumber, LocalDate date, String phone, String firstName, String lastName) {
        var customer = em.unwrap(Session.class)
                .find(Customer.class, phone, KeyType.NATURAL);

        if (Objects.isNull(customer)) {
            customer = new Customer();
            customer.setPhone(phone);
            customer.setFirstName(firstName);
            customer.setLastName(lastName);
        }

        var reservation = new TableReservation();
        reservation.setId(new TableReservationId(tableNumber, date));
        reservation.setCustomer(customer);
        reservation.setCreatedAt(Instant.now());
        em.persist(reservation);

        return new ReservationResponse(
                reservation.getId().tableNumber(),
                reservation.getId().reservationDate(),
                reservation.getCustomer().getPhone(),
                reservation.getCustomer().getFirstName(),
                reservation.getCustomer().getLastName()
        );
    }

    @Transactional
    public void cancel(Short tableNumber, LocalDate date) {
        var reservation = em.find(TableReservation.class, new TableReservationId(tableNumber, date));
        if (reservation != null) {
            em.remove(reservation);
        }
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> showDateReservations(LocalDate date) {
        var statement = """
            select r.id.tableNumber, r.id.reservationDate, c.phone, c.firstName, c.lastName
            from TableReservation r join r.customer c
            where r.id.reservationDate = :date
            order by r.id.tableNumber
        """;
        return em.createQuery(statement, ReservationResponse.class)
                .setParameter("date", date)
                .getResultList();
    }
}
