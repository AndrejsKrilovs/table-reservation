package krilovs.andrejs.reservation.config;

import jakarta.persistence.EntityExistsException;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;
import org.springframework.core.NestedExceptionUtils;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.Map;
import java.util.Objects;
import java.util.TreeMap;
import java.util.stream.Collectors;

/**
 * Единый формат ошибок:
 * <ul>
 *   <li>проверка данных: {"поле": ["сообщение", ...]};</li>
 *   <li>всё остальное: {"error": "текст"}.</li>
 * </ul>
 * Стандартные ошибки MVC (405, 415, 404 и т.п.) обрабатывает базовый класс, мы лишь меняем формат тела.
 */
@Slf4j
@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {
    private static final String CUSTOMER_PER_DATE_CONSTRAINT = "uk_reservation_date_customer".toUpperCase();

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
                                                                  @NonNull HttpHeaders headers,
                                                                  @NonNull HttpStatusCode status,
                                                                  @NonNull WebRequest request) {
        var errors = ex.getBindingResult().getFieldErrors().stream().collect(Collectors.groupingBy(
                FieldError::getField,
                TreeMap::new,
                Collectors.mapping(ApiExceptionHandler::messageOf, Collectors.joining("; "))));
        return ResponseEntity.badRequest().body(errors);
    }

    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(@NonNull HttpMessageNotReadableException ex,
                                                                  @NonNull HttpHeaders headers,
                                                                  @NonNull HttpStatusCode status,
                                                                  @NonNull WebRequest request) {
        var message = "";
        if (ex.getMessage().contains("LocalDate")) {
            message = "Некорректная дата";
        }

        return ResponseEntity.badRequest().body(error(message.isBlank() ? "Некорректное тело запроса" : message));
    }

    @Override
    protected ResponseEntity<Object> handleExceptionInternal(@NonNull Exception ex,
                                                             @Nullable Object body,
                                                             @NonNull HttpHeaders headers,
                                                             @NonNull HttpStatusCode statusCode,
                                                             @NonNull WebRequest request) {
        // часть обработчиков (например, неверный тип параметра) сразу передаёт ProblemDetail
        // тексты стандартных ошибок Spring английские, поэтому подбираем русский по статусу
        if (body instanceof ProblemDetail || (Objects.isNull(body) && ex instanceof ErrorResponse)) {
            body = error(messageFor(statusCode));
        }
        return super.handleExceptionInternal(ex, body, headers, statusCode, request);
    }

    @ExceptionHandler({DataIntegrityViolationException.class, EntityExistsException.class})
    ResponseEntity<Object> conflict(Exception e) {
        var reason = NestedExceptionUtils.getMostSpecificCause(e).getMessage();
        if (Objects.nonNull(reason) && reason.contains(CUSTOMER_PER_DATE_CONSTRAINT)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("phone", "На этот телефон уже есть бронь на выбранную дату"));
        }
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error("Стол уже занят на выбранную дату"));
    }

    @ExceptionHandler(EntityNotFoundException.class)
    ResponseEntity<Object> entityNotFound(EntityNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(error(Objects.requireNonNullElse(e.getMessage(), "Запись не найдена")));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<Object> unexpected(Exception e) {
        log.error("Unhandled error", e);
        return ResponseEntity.internalServerError().body(error("Внутренняя ошибка сервера"));
    }

    private static String messageOf(FieldError error) {
        if (error.isBindingFailure()) {
            return "Некорректное значение";
        }
        return Objects.requireNonNullElse(error.getDefaultMessage(), "Некорректное значение");
    }

    private static String messageFor(HttpStatusCode status) {
        return switch (status.value()) {
            case 400 -> "Некорректный запрос";
            case 404 -> "Ресурс не найден";
            case 405 -> "Метод не поддерживается";
            case 415 -> "Неподдерживаемый формат данных";
            default -> "Не удалось выполнить запрос";
        };
    }

    private static Map<String, String> error(String message) {
        return Map.of("error", message);
    }
}
