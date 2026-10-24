package group.four.nyare.nyare.ai.parser;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Utility for determining semantic similarity and token overlap between academic titles.
 */
public final class TitleSimilarityMatcher {

    private static final Set<String> STOP_WORDS = Set.of(
            "for", "the", "a", "an", "to", "in", "on", "of", "and", "or", "with",
            "sa", "ang", "mga", "last", "lesson", "notes"
    );

    private static final Set<String> KEY_MARKERS = Set.of(
            "quiz", "midterm", "exam", "lab", "project", "homework", "assignment", "paper"
    );

    private TitleSimilarityMatcher() {
    }

    /**
     * Determines if two titles describe the same academic item based on exact match or word-token overlap.
     *
     * @param a first title
     * @param b second title
     * @return true if titles are identical (case-insensitive) or share significant tokens
     */
    public static boolean isSimilar(String a, String b) {
        if (a == null || b == null) return false;
        String cleanA = a.trim();
        String cleanB = b.trim();
        if (cleanA.equalsIgnoreCase(cleanB)) return true;

        Set<String> wordsA = Arrays.stream(cleanA.toLowerCase().split("[^a-zA-Z0-9]+"))
                .filter(w -> !w.isBlank() && !STOP_WORDS.contains(w))
                .collect(Collectors.toSet());
        Set<String> wordsB = Arrays.stream(cleanB.toLowerCase().split("[^a-zA-Z0-9]+"))
                .filter(w -> !w.isBlank() && !STOP_WORDS.contains(w))
                .collect(Collectors.toSet());

        if (wordsA.isEmpty() || wordsB.isEmpty()) return false;

        // Count overlapping significant words
        long overlap = wordsA.stream().filter(wordsB::contains).count();
        if (overlap >= 2) return true;

        // If both mention a key academic marker (like "quiz", "midterm", "exam", "lab", "project")
        boolean sharesKeyMarker = wordsA.stream().anyMatch(w -> KEY_MARKERS.contains(w) && wordsB.contains(w));
        return sharesKeyMarker && overlap >= 1;
    }
}
