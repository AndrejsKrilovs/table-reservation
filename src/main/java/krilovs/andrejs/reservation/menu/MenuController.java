package krilovs.andrejs.reservation.menu;

import krilovs.andrejs.reservation.model.MenuSection;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.TreeMap;

/**
 * GET /api/v1/menu - Доступный список напитков
 */
@RestController
@RequestMapping("/menu")
@RequiredArgsConstructor
public class MenuController {
    private final MenuService menuService;

    @GetMapping
    public TreeMap<MenuSection, List<MenuResponse>> getAvailableMenuItems() {
        return menuService.showAvailableMenuItems();
    }
}
