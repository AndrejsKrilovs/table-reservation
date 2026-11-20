package krilovs.andrejs.reservation.reservation;

import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
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
    public void cancelByPhone(String phone, LocalDate date) {
        var statement = """
            delete from TableReservation r
            where r.id.reservationDate = :date
              and r.customer.id in (select c.id from Customer c where c.phone = :phone)
        """;
        var result = em.createQuery(statement)
                .setParameter("date", date)
                .setParameter("phone", phone)
                .executeUpdate();
        if (result == 0) {
            throw new EntityNotFoundException("На этот телефон нет брони на выбранную дату");
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
