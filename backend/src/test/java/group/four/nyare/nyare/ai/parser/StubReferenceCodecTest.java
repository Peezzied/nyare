package group.four.nyare.nyare.ai.parser;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class StubReferenceCodecTest {

    @Test
    @DisplayName("encode generates sequential prefixed references")
    void encodeGeneratesSequentialPrefixedReferences() {
        StubReferenceCodec<UUID> codec = new StubReferenceCodec<>("n");
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();

        String ref1 = codec.encode(id1);
        String ref2 = codec.encode(id2);

        assertThat(ref1).isEqualTo("n1");
        assertThat(ref2).isEqualTo("n2");
        assertThat(codec.size()).isEqualTo(2);
    }

    @Test
    @DisplayName("encode is idempotent for identical keys")
    void encodeIsIdempotent() {
        StubReferenceCodec<String> codec = new StubReferenceCodec<>("i");
        String key = "diagram.png";

        String first = codec.encode(key);
        String second = codec.encode(key);

        assertThat(first).isEqualTo("i1");
        assertThat(second).isEqualTo("i1");
        assertThat(codec.size()).isEqualTo(1);
    }

    @Test
    @DisplayName("decode resolves original value from reference")
    void decodeResolvesOriginalValue() {
        StubReferenceCodec<UUID> codec = new StubReferenceCodec<>("n");
        UUID id = UUID.randomUUID();
        String ref = codec.encode(id);

        UUID resolved = codec.decode(ref);

        assertThat(resolved).isEqualTo(id);
    }

    @Test
    @DisplayName("decode returns null for unknown, blank, or null reference")
    void decodeReturnsNullForUnknownReference() {
        StubReferenceCodec<String> codec = new StubReferenceCodec<>("n");

        assertThat(codec.decode("unknown")).isNull();
        assertThat(codec.decode(null)).isNull();
        assertThat(codec.decode("   ")).isNull();
    }

    @Test
    @DisplayName("containsReference and containsValue check membership correctly")
    void checksMembershipCorrectly() {
        StubReferenceCodec<String> codec = new StubReferenceCodec<>("item_");
        String val = "alpha";
        String ref = codec.encode(val);

        assertThat(codec.containsReference(ref)).isTrue();
        assertThat(codec.containsReference("item_99")).isFalse();
        assertThat(codec.containsValue(val)).isTrue();
        assertThat(codec.containsValue("beta")).isFalse();
    }

    @Test
    @DisplayName("clear resets internal mappings and counter")
    void clearResetsMappings() {
        StubReferenceCodec<String> codec = new StubReferenceCodec<>("k");
        codec.encode("one");
        assertThat(codec.size()).isEqualTo(1);

        codec.clear();

        assertThat(codec.size()).isEqualTo(0);
        assertThat(codec.decode("k1")).isNull();
        assertThat(codec.encode("two")).isEqualTo("k1");
    }
}
