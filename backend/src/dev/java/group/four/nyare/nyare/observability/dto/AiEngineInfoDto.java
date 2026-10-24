package group.four.nyare.nyare.observability.dto;

/**
 * AI engine configuration shown on the dashboard: the configured provider key
 * plus the resolved default chat options the model calls run with.
 *
 * @param provider    value of {@code spring.ai.model.chat} (e.g. {@code google-genai})
 * @param model       resolved model name from {@code ChatModel.getOptions()}
 * @param temperature sampling temperature, or null when unset
 * @param topP        nucleus sampling bound, or null when unset
 * @param topK        top-k sampling bound, or null when unset
 * @param maxTokens   output token cap, or null when unset
 */
public record AiEngineInfoDto(
        String provider,
        String model,
        Double temperature,
        Double topP,
        Integer topK,
        Integer maxTokens) {
}
