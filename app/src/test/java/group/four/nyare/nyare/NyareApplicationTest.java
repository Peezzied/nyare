package group.four.nyare.nyare;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class NyareApplicationTest {

    @AfterEach
    void tearDown() {
        System.clearProperty("java.awt.headless");
    }

    @Test
    void isHeadlessMode_withHeadlessCliArg_returnsTrue() {
        assertThat(NyareApplication.isHeadlessMode(new String[] {"--headless"})).isTrue();
    }

    @Test
    void isHeadlessMode_withNoGuiCliArg_returnsTrue() {
        assertThat(NyareApplication.isHeadlessMode(new String[] {"--no-gui"})).isTrue();
    }

    @Test
    void isHeadlessMode_withJavaAwtHeadlessSystemProperty_returnsTrue() {
        System.setProperty("java.awt.headless", "true");
        assertThat(NyareApplication.isHeadlessMode(new String[0])).isTrue();
    }

    @Test
    void isPackagedJar_runningFromCompiledClasses_returnsFalse() {
        assertThat(NyareApplication.isPackagedJar()).isFalse();
    }
}
