package com.example.demo.exceptions;


import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private ResponseEntity<Object> buildResponse(Exception ex, int statusCode) {
        return ResponseEntity
                .status(statusCode)
                .body(Map.of(
                        "timestamp", LocalDateTime.now(),
                        "status", statusCode,
                        "error", ex.getClass().getSimpleName(),
                        "message", ex.getMessage()
                ));
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<Object> handleNotFound(NotFoundException ex) {
        return buildResponse(ex, 404);
    }

    @ExceptionHandler(AlreadyExistsException.class)
    public ResponseEntity<Object> handleAlreadyExists(AlreadyExistsException ex) {
        return buildResponse(ex, 409);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Object> handleBadRequest(BadRequestException ex) {
        return buildResponse(ex, 400);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Object> handleUnauthorized(UnauthorizedException ex) {
        return buildResponse(ex, 401);
    }

    @ExceptionHandler(ForbiddenOperationException.class)
    public ResponseEntity<Object> handleForbidden(ForbiddenOperationException ex) {
        return buildResponse(ex, 403);
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<Object> handleValidation(ValidationException ex) {
        return buildResponse(ex, 422);
    }

    @ExceptionHandler(KeywordNotFoundException.class)
    public ResponseEntity<Object> handleKeywordNotFound(KeywordNotFoundException ex) {
        return buildResponse(ex, 404);
    }

    @ExceptionHandler(InsufficientBalanceException.class)
    public ResponseEntity<Object> handleInsufficientBalance(InsufficientBalanceException ex) {
        return buildResponse(ex, 400);
    }

    @ExceptionHandler(EmptyListException.class)
    public ResponseEntity<Object> handleEmptyList(EmptyListException ex) {
        return buildResponse(ex, 204);
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<Object> handleConflict(ConflictException ex) {
        return buildResponse(ex, 409);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleFallback(Exception ex) {
        return buildResponse(ex, 500);
    }

}
