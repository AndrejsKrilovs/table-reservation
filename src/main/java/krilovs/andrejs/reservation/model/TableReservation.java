package krilovs.andrejs.reservation.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CheckConstraint;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Getter
@Setter
@Table(name = "table_reservation",
        check = @CheckConstraint(constraint = "table_number between 1 and 10"),
        indexes = @Index(columnList = "reservationDate"))
public class TableReservation {
    @EmbeddedId
    private TableReservationId id;

    @JoinColumn(name = "customer_id")
    @ManyToOne(fetch = FetchType.LAZY, optional = false, cascade = CascadeType.PERSIST)
    private Customer customer;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
