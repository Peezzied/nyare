package group.four.nyare.nyare.model.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Validates that all reference-style image links in markdown correspond
 * bijectively to keys in the image metadata map.
 */
@Documented
@Constraint(validatedBy = ImageReferencesValidator.class)
@Target({ElementType.TYPE, ElementType.ANNOTATION_TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidImageReferences {

    String message() default "Image references in markdown do not match imageMetadata keys";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
