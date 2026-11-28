package krilovs.andrejs.reservation.menu;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import krilovs.andrejs.reservation.model.MenuSection;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
public class MenuService {
    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public TreeMap<MenuSection, List<MenuResponse>> showAvailableMenuItems() {
        var statement = """
            select m.id.section, m.id.name, m.price, m.volume, m.description
            from MenuItem m
            group by m.id.section, m.id.name, m.volume, m.price, m.description
        """;
        return em.createQuery(statement, MenuResponse.class)
                .getResultStream()
                .sorted(Comparator.comparing(MenuResponse::price))
                .collect(Collectors.groupingBy(MenuResponse::section, TreeMap::new, Collectors.toList()));
    }
}
