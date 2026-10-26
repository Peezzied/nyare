package group.four.nyare.nyare.ai.parser;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class TitleSimilarityMatcherTest {

    @Test
    @DisplayName("isSimilar returns true for exact or case-insensitive matches")
    void isSimilar_exactOrCaseInsensitive_returnsTrue() {
        // given / when / then
        assertThat(TitleSimilarityMatcher.isSimilar("Math Quiz", "Math Quiz")).isTrue();
        assertThat(TitleSimilarityMatcher.isSimilar("Math Quiz", "math quiz")).isTrue();
        assertThat(TitleSimilarityMatcher.isSimilar("  Calculus Midterm  ", "calculus midterm")).isTrue();
    }

    @Test
    @DisplayName("isSimilar returns true when Jaccard token overlap meets or exceeds threshold")
    void isSimilar_highOverlap_returnsTrue() {
        // given
        String a = "Complete Problem Set 3";
        String b = "Problem Set 3";

        // when / then
        assertThat(TitleSimilarityMatcher.isSimilar(a, b)).isTrue();
    }

    @Test
    @DisplayName("isSimilar returns false for numbered distinct items such as Quiz 1 and Quiz 2")
    void isSimilar_distinctNumberedItems_returnsFalse() {
        // given
        String a = "Quiz 1";
        String b = "Quiz 2";

        // when / then
        assertThat(TitleSimilarityMatcher.isSimilar(a, b)).isFalse();
    }

    @Test
    @DisplayName("isSimilar returns false for unrelated titles sharing common words")
    void isSimilar_unrelatedTitles_returnsFalse() {
        // given
        String a = "Review for the exam";
        String b = "Notes for the lecture";

        // when / then
        assertThat(TitleSimilarityMatcher.isSimilar(a, b)).isFalse();
    }

    @Test
    @DisplayName("isSimilar returns false for null or empty strings")
    void isSimilar_nullOrEmpty_returnsFalse() {
        // given / when / then
        assertThat(TitleSimilarityMatcher.isSimilar(null, "Quiz")).isFalse();
        assertThat(TitleSimilarityMatcher.isSimilar("Quiz", null)).isFalse();
        assertThat(TitleSimilarityMatcher.isSimilar("", "")).isFalse();
        assertThat(TitleSimilarityMatcher.isSimilar("   ", "   ")).isFalse();
    }
}
