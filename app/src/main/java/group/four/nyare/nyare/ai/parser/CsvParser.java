package group.four.nyare.nyare.ai.parser;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVPrinter;
import org.apache.commons.csv.CSVRecord;

import java.io.IOException;
import java.io.Reader;
import java.io.StringReader;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.function.Function;

/**
 * General utility to convert object collections to CSV and parse CSV records into objects.
 */
public final class CsvParser {

    private static final CSVFormat BASE_FORMAT = CSVFormat.DEFAULT;

    private static final CSVFormat PARSE_FORMAT = BASE_FORMAT.builder()
            .setHeader()
            .setSkipHeaderRecord(true)
            .setIgnoreHeaderCase(true)
            .setTrim(true).get();

    private CsvParser() {
    }

    /**
     * Converts an iterable collection of items to a CSV string.
     *
     * @param headers   the CSV header names
     * @param items     the items to serialize
     * @param rowMapper function to map an item to row columns
     * @param <T>       the element type
     * @return the formatted CSV text
     */
    public static <T> String toCsv(String[] headers, Iterable<T> items, Function<T, Object[]> rowMapper) {
        if (items == null) {
            return "";
        }
        if (items instanceof java.util.Collection<?> col && col.isEmpty()) {
            return "";
        }
        if (!items.iterator().hasNext()) {
            return "";
        }
        if (rowMapper == null) {
            throw new IllegalArgumentException("rowMapper must not be null");
        }

        CSVFormat format = (headers != null && headers.length > 0)
                ? BASE_FORMAT.builder().setHeader(headers).get()
                : BASE_FORMAT;

        StringWriter writer = new StringWriter();
        try (CSVPrinter printer = format.print(writer)) {
            for (T item : items) {
                if (item != null) {
                    Object[] values = rowMapper.apply(item);
                    printer.printRecord(values != null ? values : new Object[0]);
                }
            }
            printer.flush();
            return writer.toString();
        } catch (IOException e) {
            throw new IllegalArgumentException("Failed to format items to CSV", e);
        }
    }

    /**
     * Parses CSV text into a list of objects using a record mapper.
     *
     * @param csvContent   the CSV string
     * @param recordMapper function to map a CSVRecord to an object
     * @param <T>          the target type
     * @return list of parsed objects
     */
    public static <T> List<T> parse(String csvContent, Function<CSVRecord, T> recordMapper) {
        if (csvContent == null || csvContent.isBlank()) {
            return Collections.emptyList();
        }
        return parse(new StringReader(csvContent), recordMapper);
    }

    /**
     * Parses CSV content from a reader into a list of objects.
     *
     * @param reader       the input character stream
     * @param recordMapper function to map a CSVRecord to an object
     * @param <T>          the target type
     * @return list of parsed objects
     */
    public static <T> List<T> parse(Reader reader, Function<CSVRecord, T> recordMapper) {
        if (reader == null) {
            return Collections.emptyList();
        }
        if (recordMapper == null) {
            throw new IllegalArgumentException("recordMapper must not be null");
        }

        List<T> results = new ArrayList<>();
        try (CSVParser parser = CSVParser.builder().setReader(reader).setFormat(PARSE_FORMAT).get()) {
            for (CSVRecord record : parser) {
                T mapped = recordMapper.apply(record);
                results.add(mapped);
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("Failed to parse CSV content", e);
        }

        return results;
    }

    /**
     * Retrieves a named column value safely from a CSV record.
     *
     * @param record     the CSV record
     * @param headerName the column header name
     * @return the column value or null if not mapped
     */
    public static String getValue(CSVRecord record, String headerName) {
        if (record != null && record.isMapped(headerName)) {
            return record.get(headerName);
        }
        return null;
    }
}
