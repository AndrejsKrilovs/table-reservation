package krilovs.andrejs.reservation.model;

import jakarta.persistence.CheckConstraint;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Getter
@Setter
@Table(name = "menu_items",
        check = {
                @CheckConstraint(constraint = "volume > 0 and volume <= 2"),
                @CheckConstraint(constraint = "price > 0")})
public class MenuItem {
    @EmbeddedId
    private MenuItemId id;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private Double volume;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal price;
}
