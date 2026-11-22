import jakarta.servlet.DispatcherType;
import krilovs.andrejs.reservation.config.AppConfig;
import krilovs.andrejs.reservation.config.DevDataSeeder;
import org.eclipse.jetty.ee11.servlet.DefaultServlet;
import org.eclipse.jetty.ee11.servlet.FilterHolder;
import org.eclipse.jetty.ee11.servlet.ServletContextHandler;
import org.eclipse.jetty.ee11.servlet.ServletHolder;
import org.eclipse.jetty.http.HttpCookie;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.util.resource.ResourceFactory;
import org.h2.server.web.JakartaWebServlet;
import org.springframework.web.context.ContextLoaderListener;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.filter.DelegatingFilterProxy;
import org.springframework.web.servlet.DispatcherServlet;

import java.util.EnumSet;

void main() throws Exception {
    // Hibernate пишет логи через JBoss Logging, который по умолчанию выбирает java.util.logging.
    // Переключаем его на slf4j, чтобы все логи шли в одно место и настраивались в simplelogger.properties
    System.setProperty("org.jboss.logging.provider", "slf4j");

    var spring = new AnnotationConfigWebApplicationContext();
    spring.register(AppConfig.class);

    // SESSIONS: админ входит через форму и остаётся в HTTP-сессии (cookie JSESSIONID)
    var context = new ServletContextHandler("/", ServletContextHandler.SESSIONS);
    context.getSessionHandler().setHttpOnly(true);   // cookie недоступна из JavaScript
    context.getSessionHandler().setSameSite(HttpCookie.SameSite.LAX);   // не уходит с чужих сайтов при POST
    // фронтенд: файлы из classpath (src/main/resources/static), их кладёт туда сборка Vite
    context.setBaseResource(ResourceFactory.of(context).newClassLoaderResource("static"));
    context.setWelcomeFiles(new String[]{"index.html"});
    context.addServlet(DefaultServlet.class, "/");

    // Spring поднимается слушателем до инициализации фильтров и сервлетов: фильтр безопасности берёт бины из него
    context.addEventListener(new ContextLoaderListener(spring));
    context.addFilter(new FilterHolder(new DelegatingFilterProxy("springSecurityFilterChain")), "/*",
            EnumSet.of(DispatcherType.REQUEST));
    if (AppConfig.isDev(spring.getEnvironment())) {
        context.addServlet(JakartaWebServlet.class, "/h2-console/*");   // http://localhost:8080/h2-console
    }

    var dispatcher = new ServletHolder(new DispatcherServlet(spring));
    dispatcher.setInitOrder(1);   // поднять Spring при старте сервера, а не при первом запросе
    context.addServlet(dispatcher, "/api/v1/*");

    var server = new Server(Integer.parseInt(spring.getEnvironment().getProperty("PORT", "8080")));
    server.setHandler(context);
    try {
        server.start();   // вместе с сервером поднимается и Spring (initOrder у DispatcherServlet)
        spring.getBean(DevDataSeeder.class).seedIfDev();   // тестовые данные, только на H2
        server.join();
    }
    finally {
        server.stop();
    }
}
