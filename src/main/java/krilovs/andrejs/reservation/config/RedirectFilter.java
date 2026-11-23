package krilovs.andrejs.reservation.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/**
 * Если /api/v1/... открыли прямо в адресной строке браузера, показываем главную страницу, а не JSON.
 * Запросы самого приложения (fetch) идут с Sec-Fetch-Mode: cors или same-origin, поэтому не затрагиваются.
 */
public class RedirectFilter extends HttpFilter {
    @Override
    protected void doFilter(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws IOException, ServletException {
        if ("GET".equals(req.getMethod()) && "navigate".equals(req.getHeader("Sec-Fetch-Mode"))) {
            res.sendRedirect("/");
            return;
        }
        chain.doFilter(req, res);
    }
}
