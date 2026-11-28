package krilovs.andrejs.reservation.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

/** Позиция уникальна по разделу и названию. */
@Embeddable
public record MenuItemId(
        @Enumerated(EnumType.STRING) @Column(length = 20) MenuSection section,
        @Column(name = "item_name", length = 100) String name) {
}
