package krilovs.andrejs.reservation.config;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.eclipse.jetty.ee11.servlet.DefaultServlet;

import java.io.IOException;

/**
 * Отдаёт статические файлы фронтенда, а любой путь, которого нет среди файлов (/admin-console, /что-угодно),
 * заменяет на index.html: дальше маршрут разбирает react-router (App.tsx), а неизвестные пути он уводит на главную.
 */
public class MainServlet extends DefaultServlet {
    private static final String INDEX = "/index.html";

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        var path = request.getServletPath();
        if (!path.equals("/") && getServletContext().getResource(path) == null) {
            // forward приходит сюда снова уже с путём /index.html, он существует и отдаётся как файл
            request.getRequestDispatcher(INDEX).forward(request, response);
            return;
        }
        super.doGet(request, response);
    }
}
