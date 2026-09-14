package group.four.nyare.nyare.exception;

/**
 * Canonical domain exception thrown when an incoming request or operation violates
 * domain business rules, domain invariants, or cross-entity integrity constraints.
 * <p>
 * For example:
 * <ul>
 *     <li>Attempting to associate an academic event or task with a note belonging to a different course.</li>
 *     <li>Supplying mutually incompatible filter or state transition parameters.</li>
 * </ul>
 * <p>
 * This exception maps canonically to an RFC 7807 (Problem Details) {@code 400 Bad Request} HTTP response
 * in the controller advice / exception handling layer.
 */
public class BadRequestException extends RuntimeException {

    /**
     * Constructs a new {@code BadRequestException} with the specified detail message.
     *
     * @param message the detail message describing the constraint violation
     */
    public BadRequestException(String message) {
        super(message);
    }

    /**
     * Constructs a new {@code BadRequestException} with the specified detail message and root cause.
     *
     * @param message the detail message describing the constraint violation
     * @param cause   the underlying cause of the exception
     */
    public BadRequestException(String message, Throwable cause) {
        super(message, cause);
    }
}
