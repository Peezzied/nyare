package group.four.nyare.nyare.ai.parser;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Utility for determining similarity between academic titles using Jaccard token overlap.
 */
public final class TitleSimilarityMatcher {

    private static final double SIMILARITY_THRESHOLD = 0.6;

    private TitleSimilarityMatcher() {
    }

    /**
     * Determines if two titles describe the same academic item based on exact match or token similarity.
     *
     * @param a first title
     * @param b second title
     * @return true if titles are identical (case-insensitive) or exceed the similarity threshold
     */
    public static boolean isSimilar(String a, String b) {
        if (a == null || b == null) return false;
        String cleanA = a.trim();
        String cleanB = b.trim();
        if (cleanA.isBlank() || cleanB.isBlank()) return false;
        if (cleanA.equalsIgnoreCase(cleanB)) return true;

        Set<String> wordsA = tokenize(cleanA);
        Set<String> wordsB = tokenize(cleanB);
        if (wordsA.isEmpty() || wordsB.isEmpty()) return false;

        long intersection = wordsA.stream().filter(wordsB::contains).count();
        long union = wordsA.size() + wordsB.size() - intersection;

        return (double) intersection / union >= SIMILARITY_THRESHOLD;
    }

    private static Set<String> tokenize(String input) {
        return Arrays.stream(input.toLowerCase().split("[^a-zA-Z0-9]+"))
                .filter(w -> !w.isBlank())
                .collect(Collectors.toSet());
    }
}
