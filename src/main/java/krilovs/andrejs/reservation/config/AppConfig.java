package krilovs.andrejs.reservation.config;

import io.agroal.api.AgroalDataSource;
import io.agroal.api.configuration.supplier.AgroalDataSourceConfigurationSupplier;
import io.agroal.api.security.NamePrincipal;
import io.agroal.api.security.SimplePassword;
import jakarta.persistence.EntityManagerFactory;
import liquibase.integration.spring.SpringLiquibase;
import org.apache.commons.lang3.StringUtils;
import org.hibernate.boot.model.naming.PhysicalNamingStrategySnakeCaseImpl;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;
import org.springframework.core.env.Environment;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.util.Properties;

@Configuration
@EnableWebMvc
@EnableTransactionManagement
@ComponentScan("krilovs.andrejs.reservation")
public class AppConfig {
    // для разработки: база в памяти (режим PostgreSQL, чтобы миграции были общими с боевой базой)
    private static final String H2_URL = "jdbc:h2:mem:club;DB_CLOSE_DELAY=-1;MODE=PostgreSQL";

    /**
     * Настройки берутся из переменных окружения: DB_URL, DB_USER, DB_PASSWORD (и PORT в Main).
     * Без DB_URL приложение работает на H2 в памяти.
     */
    public static boolean isDev(Environment env) {
        return env.getProperty("DB_URL", H2_URL).startsWith("jdbc:h2:");
    }

    @Bean(destroyMethod = "close")
    AgroalDataSource dataSource(Environment env) throws SQLException {
        var config = new AgroalDataSourceConfigurationSupplier()
                .connectionPoolConfiguration(pool -> pool
                        .minSize(1)
                        .maxSize(10)
                        .connectionFactoryConfiguration(factory -> factory
                                .jdbcUrl(env.getProperty("DB_URL", H2_URL))
                                .principal(new NamePrincipal(env.getProperty("DB_USER", "sa")))
                                .credential(new SimplePassword(env.getProperty("DB_PASSWORD", StringUtils.EMPTY)))));
        return AgroalDataSource.from(config);
    }

    // схема базы создаётся миграциями Liquibase (src/main/resources/db/changelog) при старте приложения
    @Bean
    SpringLiquibase liquibase(DataSource dataSource) {
        var liquibase = new SpringLiquibase();
        liquibase.setDataSource(dataSource);
        liquibase.setChangeLog("classpath:db/changelog/db.changelog-master.yml");
        return liquibase;
    }

    @Bean
    @DependsOn("liquibase") // таблицы должны появиться до запуска Hibernate
    LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource dataSource, Environment env) {
        var emf = new LocalContainerEntityManagerFactoryBean();
        emf.setDataSource(dataSource);
        emf.setPackagesToScan("krilovs.andrejs.reservation.model");
        emf.setJpaVendorAdapter(new HibernateJpaVendorAdapter());

        var props = new Properties();
        props.put("hibernate.physical_naming_strategy", PhysicalNamingStrategySnakeCaseImpl.class.getName());
        props.put("hibernate.show_sql", String.valueOf(isDev(env))); // SQL в лог только при разработке
        emf.setJpaProperties(props);
        return emf;
    }

    @Bean
    PlatformTransactionManager transactionManager(EntityManagerFactory emf) {
        return new JpaTransactionManager(emf);
    }
}
