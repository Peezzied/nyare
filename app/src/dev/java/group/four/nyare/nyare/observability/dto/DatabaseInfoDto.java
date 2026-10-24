package group.four.nyare.nyare.observability.dto;

/**
 * Database identity shown on the dashboard: the configured JDBC URL and the
 * resolved engine behind it.
 *
 * @param product display name of the database engine (e.g. {@code SQLite})
 * @param url     effective {@code spring.datasource.url} JDBC URL
 * @param path    absolute file path for file-backed SQLite, or null when the
 *                database is in-memory or not file-based
 */
public record DatabaseInfoDto(
        String product,
        String url,
        String path) {
}
