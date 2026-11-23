package krilovs.andrejs.reservation.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import javax.sql.DataSource;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Random;
import java.util.stream.IntStream;

/**
 * Заполняет базу тестовыми данными при старте: клиенты и брони на случайные столы и даты ближайших месяцев (часть столов остаётся свободной).
 * Работает только на H2 в памяти (см. {@link AppConfig#isDev}), боевая база не затрагивается.
 * <p>
 * Вставка идёт обычным JDBC-пакетом, а не через Hibernate: в режиме разработки включён show_sql,
 * и 1000 отдельных insert залили бы консоль.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DevDataSeeder {
    private static final int CUSTOMERS = 100;
    private static final double OCCUPANCY = 0.3; // доля занятых мест, остальные столы остаются свободными
    private static final int MONTHS = 3;
    private static final int TABLES = 10; // как в check-ограничении таблицы table_reservation

    private static final List<String> FIRST_NAMES = List.of(
            "Иван", "Пётр", "Сергей", "Андрей", "Дмитрий", "Алексей", "Михаил", "Николай", "Павел", "Олег",
            "Анна", "Мария", "Елена", "Ольга", "Наталья", "Ирина", "Татьяна", "Светлана", "Юлия", "Екатерина");
    private static final List<String> LAST_NAMES = List.of(
            "Иванов", "Петров", "Сидоров", "Смирнов", "Кузнецов", "Попов", "Васильев", "Соколов", "Михайлов", "Новиков",
            "Фёдоров", "Морозов", "Волков", "Алексеев", "Лебедев", "Семёнов", "Егоров", "Павлов", "Козлов", "Степанов");

    private record Slot(LocalDate date, short table) {
    }

    private final Environment env;
    private final DataSource dataSource;
    private final PlatformTransactionManager transactionManager;

    /** Вызывается из Main после старта сервера: Spring уже поднят, миграции Liquibase создали таблицы. */
    public void seedIfDev() {
        if (!AppConfig.isDev(env)) {
            return;
        }
        var jdbc = new JdbcTemplate(dataSource);
        new TransactionTemplate(transactionManager).executeWithoutResult(_ -> seed(jdbc));
    }

    private void seed(JdbcTemplate jdbc) {
        var random = new Random();

        var customers = IntStream.rangeClosed(1, CUSTOMERS)
                .mapToObj(i -> new Object[]{
                        "2%07d".formatted(i), // телефон из 8 цифр, уникальный
                        FIRST_NAMES.get(random.nextInt(FIRST_NAMES.size())),
                        LAST_NAMES.get(random.nextInt(LAST_NAMES.size()))})
                .toList();
        jdbc.batchUpdate("insert into customer (phone, first_name, last_name) values (?, ?, ?)", customers);
        var customerIds = jdbc.queryForList("select id from customer", Long.class);

        // одна бронь на стол и дату; занимаем только часть мест, чтобы в каждый день были и свободные столы
        var today = LocalDate.now();
        var slots = new ArrayList<Slot>();
        today.datesUntil(today.plusMonths(MONTHS))
                .forEach(date -> IntStream.rangeClosed(1, TABLES).forEach(table -> slots.add(new Slot(date, (short) table))));
        Collections.shuffle(slots, random);

        var count = (int) Math.round(slots.size() * OCCUPANCY);

        // один человек - одна бронь на дату: запоминаем, кто уже занят в этот день
        var busyByDate = new HashMap<LocalDate, HashSet<Long>>();
        var createdAt = OffsetDateTime.now();
        var reservations = new ArrayList<Object[]>(count);
        for (var slot : slots.subList(0, count)) {
            var busy = busyByDate.computeIfAbsent(slot.date(), _ -> new HashSet<>());
            Long customerId;
            do {
                customerId = customerIds.get(random.nextInt(customerIds.size()));
            } while (!busy.add(customerId)); // в день не больше TABLES броней, клиентов больше, цикл завершится
            reservations.add(new Object[]{slot.date(), slot.table(), createdAt, customerId});
        }
        jdbc.batchUpdate("insert into table_reservation (reservation_date, table_number, created_at, customer_id) "
                + "values (?, ?, ?, ?)", reservations);

        log.info("Тестовые данные: {} клиентов, {} броней из {} мест на {} месяца(ев) вперёд",
                customerIds.size(), count, slots.size(), MONTHS);
    }
}
