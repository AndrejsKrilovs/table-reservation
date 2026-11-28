package krilovs.andrejs.reservation.menu;

import krilovs.andrejs.reservation.model.MenuSection;

import java.math.BigDecimal;

public record MenuResponse(MenuSection section, String name, BigDecimal price, Double volume, String description) {
}
