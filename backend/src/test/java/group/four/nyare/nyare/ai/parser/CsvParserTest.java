package group.four.nyare.nyare.ai.parser;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.StringReader;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CsvParserTest {

    record SampleTask(int ref, String title, String date) {}

    @Test
    @DisplayName("toCsv formats generic items with custom headers and row mapper")
    void toCsv_customItems_producesValidCsv() {
        // given
        String[] headers = {"ref", "title", "date"};
        List<SampleTask> tasks = List.of(
                new SampleTask(1, "Study Discrete Math", "2026-09-21"),
                new SampleTask(2, "Review Notes, Chapter 2", "2026-09-22")
        );

        // when
        String csv = CsvParser.toCsv(headers, tasks, t -> new Object[]{t.ref(), t.title(), t.date()});

        // then
        assertThat(csv)
                .contains("ref,title,date")
                .contains("1,Study Discrete Math,2026-09-21")
                .contains("2,\"Review Notes, Chapter 2\",2026-09-22");
    }

    @Test
    @DisplayName("toCsv returns empty string for null or empty items")
    void toCsv_nullOrEmpty_returnsEmptyString() {
        String[] headers = {"ref", "title"};
        assertThat(CsvParser.toCsv(headers, null, t -> new Object[0])).isEmpty();
        assertThat(CsvParser.toCsv(headers, Collections.emptyList(), t -> new Object[0])).isEmpty();
    }

    @Test
    @DisplayName("parse converts CSV text to generic typed objects")
    void parse_validCsvText_returnsMappedObjects() {
        // given
        String csv = """
                ref,title,date
                1,Lab Activity 1,2026-09-20
                2,Project Proposal,2026-09-25
                """;

        // when
        List<SampleTask> tasks = CsvParser.parse(csv, record -> new SampleTask(
                Integer.parseInt(CsvParser.getValue(record, "ref")),
                CsvParser.getValue(record, "title"),
                CsvParser.getValue(record, "date")
        ));

        // then
        assertThat(tasks).hasSize(2);
        assertThat(tasks.get(0)).isEqualTo(new SampleTask(1, "Lab Activity 1", "2026-09-20"));
        assertThat(tasks.get(1)).isEqualTo(new SampleTask(2, "Project Proposal", "2026-09-25"));
    }

    @Test
    @DisplayName("parse with Reader converts character stream into objects")
    void parse_reader_convertsStream() {
        // given
        String csv = """
                ref,title,date
                1,Read Chapter 3,2026-09-23
                """;

        // when
        List<SampleTask> tasks = CsvParser.parse(new StringReader(csv), record -> new SampleTask(
                Integer.parseInt(CsvParser.getValue(record, "ref")),
                CsvParser.getValue(record, "title"),
                CsvParser.getValue(record, "date")
        ));

        // then
        assertThat(tasks).hasSize(1);
        assertThat(tasks.get(0).title()).isEqualTo("Read Chapter 3");
    }

    @Test
    @DisplayName("parse returns empty list for null or blank input")
    void parse_nullOrBlank_returnsEmptyList() {
        assertThat(CsvParser.parse((String) null, record -> "test")).isEmpty();
        assertThat(CsvParser.parse("", record -> "test")).isEmpty();
        assertThat(CsvParser.parse("   ", record -> "test")).isEmpty();
        assertThat(CsvParser.parse((StringReader) null, record -> "test")).isEmpty();
    }

    @Test
    @DisplayName("getValue returns null when column is not mapped in record")
    void getValue_unmappedColumn_returnsNull() {
        String csv = """
                colA
                valueA
                """;

        List<String> values = CsvParser.parse(csv, record -> CsvParser.getValue(record, "nonExistent"));
        assertThat(values).containsExactly((String) null);
    }
}
