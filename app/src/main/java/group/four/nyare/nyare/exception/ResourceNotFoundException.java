package group.four.nyare.nyare.exception;

/**
 * Thrown when an entity or resource referenced by an identifier cannot be found in persistence.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
