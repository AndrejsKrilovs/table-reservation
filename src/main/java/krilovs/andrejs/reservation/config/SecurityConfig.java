package krilovs.andrejs.reservation.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.commons.lang3.StringUtils;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.annotation.web.configurers.RequestCacheConfigurer;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.web.servlet.HandlerExceptionResolver;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

/**
 * Публичное API бронирования открыто всем, раздел /api/v1/admin доступен после входа администратора.
 * <ul>
 *   <li>вход: POST /api/v1/login с полями username и password, после него браузер получает cookie JSESSIONID;</li>
 *   <li>выход: POST /api/v1/logout;</li>
 *   <li>логин и пароль: ADMIN_USER (по умолчанию admin) и ADMIN_PASSWORD; на H2 в разработке пароль по умолчанию
 *   admin, на боевой базе ADMIN_PASSWORD обязателен.</li>
 * </ul>
 * Фильтр безопасности подключается в Main, тексты ошибок 401 и 403 формирует {@link ApiExceptionHandler}.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    private static final String ADMIN_ROLE = "ADMIN";

    @Bean
    AuthenticationProvider adminAuthenticationProvider(Environment env) {
        var admin = env.getProperty("ADMIN_USER", "admin");
        var password = env.getProperty("ADMIN_PASSWORD", AppConfig.isDev(env) ? "admin" : StringUtils.EMPTY);
        if (password.isBlank()) {
            // без пароля админский раздел остался бы без защиты, поэтому не стартуем
            throw new IllegalStateException("Задайте переменную окружения ADMIN_PASSWORD");
        }
        var encoder = PasswordEncoderFactories.createDelegatingPasswordEncoder();
        var encodedPassword = encoder.encode(password); // сравниваем через bcrypt, а не открытым текстом

        return new AuthenticationProvider() {
            @Override
            public Authentication authenticate(@NonNull Authentication authentication) throws AuthenticationException {
                var credentials = Objects.toString(authentication.getCredentials(), StringUtils.EMPTY);
                // обе проверки выполняются всегда (&, а не &&): по времени ответа не видно, что именно неверно
                var valid = admin.equals(authentication.getName()) & encoder.matches(credentials, encodedPassword);
                if (!valid) {
                    throw new BadCredentialsException("Неверный логин или пароль");
                }
                return UsernamePasswordAuthenticationToken.authenticated(
                        admin, null, List.of(new SimpleGrantedAuthority("ROLE_" + ADMIN_ROLE)));
            }

            @Override
            public boolean supports(@NonNull Class<?> authentication) {
                return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authentication);
            }
        };
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http,
                                            @Qualifier("handlerExceptionResolver") HandlerExceptionResolver resolver) {
        // 401 и 403 возникают в фильтре Spring Security до MVC, поэтому @RestControllerAdvice их сам не увидит.
        // Передаём исключения в тот же механизм, и тело ответа формирует ApiExceptionHandler
        AuthenticationFailureHandler unauthorized = (request, response, e) ->
                delegate(resolver, request, response, e, HttpStatus.UNAUTHORIZED);

        return http
                // сессионный вход: cookie JSESSIONID; админский раздел только читает (GET),
                // а публичные POST и DELETE и так открыты, поэтому CSRF-токен не нужен
                .csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .requestCache(RequestCacheConfigurer::disable)

                .formLogin(form -> form
                        .loginPage("/admin-console")
                        .loginProcessingUrl("/api/v1/login")
                        .successHandler((_, response, _) -> response.setStatus(HttpServletResponse.SC_OK))
                        .failureHandler(unauthorized)
                        .permitAll())

                .logout(logout -> logout
                        .logoutUrl("/api/v1/logout")
                        .invalidateHttpSession(true)
                        .clearAuthentication(true)
                        .deleteCookies("JSESSIONID")
                        .logoutSuccessHandler((_, response, _) -> response.setStatus(HttpServletResponse.SC_OK))
                        .permitAll())

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/admin/**").hasRole(ADMIN_ROLE)
                        .anyRequest().permitAll())

                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint((request, response, e) ->
                                delegate(resolver, request, response, e, HttpStatus.UNAUTHORIZED))
                        .accessDeniedHandler((request, response, e) ->
                                delegate(resolver, request, response, e, HttpStatus.FORBIDDEN)))

                // консоль H2 (только в разработке) открывается во фреймах той же страницы
                .headers(headers -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::sameOrigin))
                .build();
    }

    private static void delegate(HandlerExceptionResolver resolver, HttpServletRequest request,
                                 HttpServletResponse response, Exception e, HttpStatus fallback) throws IOException {
        // resolveException вернёт null, если ни один обработчик не подошёл: тогда не оставляем пустой ответ 200
        if (resolver.resolveException(request, response, null, e) == null) {
            response.sendError(fallback.value());
        }
    }
}
