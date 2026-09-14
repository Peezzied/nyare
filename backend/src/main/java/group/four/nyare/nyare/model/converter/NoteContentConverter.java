package group.four.nyare.nyare.model.converter;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import group.four.nyare.nyare.model.NoteContent;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * JPA AttributeConverter that persists structured {@link NoteContent} as JSON TEXT in SQLite.
 */
@Converter(autoApply = true)
public class NoteContentConverter implements AttributeConverter<NoteContent, String> {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(NoteContent attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            return OBJECT_MAPPER.writeValueAsString(attribute);
        } catch (JacksonException e) {
            throw new IllegalArgumentException("Failed to serialize NoteContent to JSON", e);
        }
    }

    @Override
    public NoteContent convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return null;
        }
        try {
            return OBJECT_MAPPER.readValue(dbData, NoteContent.class);
        } catch (JacksonException e) {
            throw new IllegalArgumentException("Failed to deserialize JSON to NoteContent", e);
        }
    }
}
