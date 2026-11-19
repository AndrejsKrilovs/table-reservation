package krilovs.andrejs.reservation.config;

import jakarta.persistence.EntityExistsException;
import lombok.extern.slf4j.Slf4j;
import org.jspecify.annotations.NonNull;
import org.jspecify.annotations.Nullable;
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

import java.util.ArrayList;
import java.util.Collections;
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

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex,
                                                                  @NonNull HttpHeaders headers,
                                                                  @NonNull HttpStatusCode status,
                                                                  @NonNull WebRequest request) {
        var errors = ex.getBindingResult().getFieldErrors().stream().collect(Collectors.groupingBy(
                FieldError::getField,
                TreeMap::new,
                Collectors.mapping(FieldError::getDefaultMessage, Collectors.toCollection(ArrayList::new))));
        errors.values().forEach(Collections::sort);
        return ResponseEntity.badRequest().body(errors);
    }

    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(@NonNull HttpMessageNotReadableException ex,
                                                                  @NonNull HttpHeaders headers,
                                                                  @NonNull HttpStatusCode status,
                                                                  @NonNull WebRequest request) {
        return ResponseEntity.badRequest().body(error("Invalid JSON body"));
    }

    @Override
    protected ResponseEntity<Object> handleExceptionInternal(@NonNull Exception ex,
                                                             @Nullable Object body,
                                                             @NonNull HttpHeaders headers,
                                                             @NonNull HttpStatusCode statusCode,
                                                             @NonNull WebRequest request) {
        // часть обработчиков (например, неверный тип параметра) сразу передаёт ProblemDetail
        if (body instanceof ProblemDetail problem) {
            body = error(Objects.requireNonNullElse(problem.getDetail(), "Request failed"));
        }
        else if (Objects.isNull(body) && ex instanceof ErrorResponse errorResponse) {
            body = error(Objects.requireNonNullElse(errorResponse.getBody().getDetail(), "Request failed"));
        }
        return super.handleExceptionInternal(ex, body, headers, statusCode, request);
    }

    @ExceptionHandler({DataIntegrityViolationException.class, EntityExistsException.class})
    ResponseEntity<Object> conflict() {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error("Table is already reserved for this date"));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<Object> unexpected(Exception e) {
        log.error("Unhandled error", e);
        return ResponseEntity.internalServerError().body(error("Internal server error"));
    }

    private static Map<String, String> error(String message) {
        return Map.of("error", message);
    }
}
