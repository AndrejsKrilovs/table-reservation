import krilovs.andrejs.reservation.config.AppConfig;
import org.eclipse.jetty.ee11.servlet.DefaultServlet;
import org.eclipse.jetty.ee11.servlet.ServletContextHandler;
import org.eclipse.jetty.ee11.servlet.ServletHolder;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.util.resource.ResourceFactory;
import org.h2.server.web.JakartaWebServlet;
import org.springframework.web.context.support.AnnotationConfigWebApplicationContext;
import org.springframework.web.servlet.DispatcherServlet;

void main() throws Exception {
    // Hibernate пишет логи через JBoss Logging, который по умолчанию выбирает java.util.logging.
    // Переключаем его на slf4j, чтобы все логи шли в одно место и настраивались в simplelogger.properties
    System.setProperty("org.jboss.logging.provider", "slf4j");

    var spring = new AnnotationConfigWebApplicationContext();
    spring.register(AppConfig.class);

    var context = new ServletContextHandler("/");
    // фронтенд: файлы из classpath (src/main/resources/static), их кладёт туда сборка Vite
    context.setBaseResource(ResourceFactory.of(context).newClassLoaderResource("static"));
    context.setWelcomeFiles(new String[]{"index.html"});
    context.addServlet(DefaultServlet.class, "/");
    if (AppConfig.isDev(spring.getEnvironment())) {
        context.addServlet(JakartaWebServlet.class, "/h2-console/*");   // http://localhost:8080/h2-console
    }

    var dispatcher = new ServletHolder(new DispatcherServlet(spring));
    dispatcher.setInitOrder(1);   // поднять Spring при старте сервера, а не при первом запросе
    context.addServlet(dispatcher, "/api/v1/*");

    var server = new Server(Integer.parseInt(spring.getEnvironment().getProperty("PORT", "8080")));
    server.setHandler(context);
    try {
        server.start();
        server.join();
    }
    finally {
        server.stop();
    }
}
