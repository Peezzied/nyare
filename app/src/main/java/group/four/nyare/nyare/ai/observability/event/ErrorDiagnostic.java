package group.four.nyare.nyare.ai.observability.event;

/**
 * Exception details captured when an audit trace event has severity {@code ERROR}.
 *
 * @param exceptionClass fully qualified or simple exception class name
 * @param message        exception error message
 * @param rootCause      root cause message
 * @param stackPreview   truncated top frames of the stack trace
 */
public record ErrorDiagnostic(
        String exceptionClass,
        String message,
        String rootCause,
        String stackPreview) {

    private static final int STACK_PREVIEW_FRAMES = 8;
    private static final int MAX_CAUSE_DEPTH = 20;

    /**
     * Builds a diagnostic snapshot from a thrown error: the exception class and
     * message, the deepest cause rendered as {@code className: message}, and the
     * top {@value #STACK_PREVIEW_FRAMES} frames of the stack trace. The cause walk
     * stops after {@value #MAX_CAUSE_DEPTH} hops so a cyclic cause chain cannot
     * loop forever.
     *
     * @param throwable captured exception
     * @return populated diagnostic record
     */
    public static ErrorDiagnostic from(Throwable throwable) {
        Throwable root = throwable;
        for (int depth = 0; depth < MAX_CAUSE_DEPTH && root.getCause() != null; depth++) {
            root = root.getCause();
        }
        StackTraceElement[] frames = throwable.getStackTrace();
        int limit = Math.min(frames.length, STACK_PREVIEW_FRAMES);
        StringBuilder preview = new StringBuilder();
        for (int i = 0; i < limit; i++) {
            if (i > 0) {
                preview.append('\n');
            }
            preview.append("at ").append(frames[i]);
        }
        return new ErrorDiagnostic(
                throwable.getClass().getName(),
                throwable.getMessage(),
                root.getClass().getName() + ": " + root.getMessage(),
                preview.toString());
    }
}
