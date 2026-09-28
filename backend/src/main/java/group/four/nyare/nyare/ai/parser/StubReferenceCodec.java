package group.four.nyare.nyare.ai.parser;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Bidirectional codec that encodes entity identifiers or objects into compact stub references (e.g., n1, i1)
 * and decodes stub references back to their original values.
 *
 * @param <T> the type of value being encoded and decoded
 */
public class StubReferenceCodec<T> {

    private final String prefix;
    private final Map<T, String> valueToStub = new LinkedHashMap<>();
    private final Map<String, T> stubToValue = new HashMap<>();
    private int counter = 1;

    /**
     * Creates a codec with an optional prefix for generated stub references.
     *
     * @param prefix the prefix prepended to sequential numbers (e.g. "n" generates "n1", "n2")
     */
    public StubReferenceCodec(String prefix) {
        this.prefix = prefix != null ? prefix.trim() : "";
    }

    /**
     * Encodes a value into a compact stub reference.
     * Idempotent: returns the existing reference if the value was already encoded.
     *
     * @param value the value to encode
     * @return the stub reference string, or empty string if value is null
     */
    public synchronized String encode(T value) {
        if (value == null) {
            return "";
        }
        return this.valueToStub.computeIfAbsent(value, v -> {
            String stub = this.prefix + (this.counter++);
            this.stubToValue.put(stub, v);
            return stub;
        });
    }

    /**
     * Decodes a stub reference back to its original value.
     *
     * @param reference the stub reference string
     * @return the original value, or null if reference is unknown, null, or blank
     */
    public synchronized T decode(String reference) {
        if (reference == null || reference.isBlank()) {
            return null;
        }
        return this.stubToValue.get(reference.trim());
    }

    /**
     * Checks if a stub reference exists in this codec.
     *
     * @param reference the stub reference to check
     * @return true if the reference exists, false otherwise
     */
    public synchronized boolean containsReference(String reference) {
        if (reference == null || reference.isBlank()) {
            return false;
        }
        return this.stubToValue.containsKey(reference.trim());
    }

    /**
     * Checks if a value has already been encoded in this codec.
     *
     * @param value the value to check
     * @return true if the value is registered, false otherwise
     */
    public synchronized boolean containsValue(T value) {
        if (value == null) {
            return false;
        }
        return this.valueToStub.containsKey(value);
    }

    /**
     * Returns the total number of encoded entries.
     *
     * @return count of registered references
     */
    public synchronized int size() {
        return this.valueToStub.size();
    }

    /**
     * Clears all registered mappings and resets the counter.
     */
    public synchronized void clear() {
        this.valueToStub.clear();
        this.stubToValue.clear();
        this.counter = 1;
    }
}
