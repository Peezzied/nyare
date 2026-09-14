package group.four.nyare.nyare.model.validation;

import group.four.nyare.nyare.model.NoteContent;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Validates that image reference labels present in markdown correspond
 * bijectively to keys in the note's imageMetadata map.
 */
public class ImageReferencesValidator implements ConstraintValidator<ValidImageReferences, NoteContent> {

    private static final Pattern IMAGE_REF_PATTERN = Pattern.compile("!\\[[^\\]]*\\]\\[([^\\]]+)\\]");

    @Override
    public boolean isValid(NoteContent content, ConstraintValidatorContext context) {
        if (content == null || content.getMarkdown() == null) {
            return true;
        }

        Set<String> markdownRefs = extractMarkdownImageReferences(content.getMarkdown());
        Map<String, ?> metadataMap = content.getImageMetadata();
        Set<String> metadataKeys = metadataMap != null ? metadataMap.keySet() : Set.of();

        boolean isValid = true;
        context.disableDefaultConstraintViolation();

        for (String ref : markdownRefs) {
            if (!metadataKeys.contains(ref)) {
                context.buildConstraintViolationWithTemplate(
                                "Image reference '" + ref + "' in markdown does not have corresponding entry in imageMetadata")
                        .addPropertyNode("imageMetadata")
                        .addConstraintViolation();
                isValid = false;
            }
        }

        for (String key : metadataKeys) {
            if (!markdownRefs.contains(key)) {
                context.buildConstraintViolationWithTemplate(
                                "imageMetadata contains unreferenced key '" + key + "'")
                        .addPropertyNode("imageMetadata")
                        .addConstraintViolation();
                isValid = false;
            }
        }

        return isValid;
    }

    private Set<String> extractMarkdownImageReferences(String markdown) {
        Set<String> refs = new HashSet<>();
        Matcher matcher = IMAGE_REF_PATTERN.matcher(markdown);
        while (matcher.find()) {
            refs.add(matcher.group(1).trim());
        }
        return refs;
    }
}
