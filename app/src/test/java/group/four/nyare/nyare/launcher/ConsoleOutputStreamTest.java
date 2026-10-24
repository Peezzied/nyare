package group.four.nyare.nyare.launcher;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import javax.swing.JTextArea;
import javax.swing.SwingUtilities;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ConsoleOutputStreamTest {

    private ByteArrayOutputStream captured;
    private JTextArea area;
    private ConsoleOutputStream stream;

    @BeforeEach
    void setUp() {
        captured = new ByteArrayOutputStream();
        area = new JTextArea();
        stream = new ConsoleOutputStream(
                new PrintStream(captured, true, StandardCharsets.UTF_8), area);
    }

    private static void drainEdt() throws Exception {
        SwingUtilities.invokeAndWait(() -> { });
    }

    @Test
    void write_completeLine_appendsToTargetAndOriginal() throws Exception {
        // given
        String line = "server started\n";

        // when
        stream.write(line.getBytes(StandardCharsets.UTF_8));
        drainEdt();

        // then
        assertThat(captured.toString(StandardCharsets.UTF_8)).isEqualTo(line);
        assertThat(area.getText()).isEqualTo(line);
    }

    @Test
    void write_partialLine_holdsUntilNewlineArrives() throws Exception {
        // given
        stream.write("partial".getBytes(StandardCharsets.UTF_8));
        drainEdt();

        // when
        assertThat(area.getText()).isEmpty();
        stream.write(" done\n".getBytes(StandardCharsets.UTF_8));
        drainEdt();

        // then
        assertThat(area.getText()).isEqualTo("partial done\n");
    }

    @Test
    void flush_pendingText_emitsPartialLine() throws Exception {
        // given
        stream.write("no newline".getBytes(StandardCharsets.UTF_8));

        // when
        stream.flush();
        drainEdt();

        // then
        assertThat(area.getText()).isEqualTo("no newline");
    }

    @Test
    void write_overMaxLines_trimsOldestLines() throws Exception {
        // given
        StringBuilder bulk = new StringBuilder();
        for (int i = 0; i < ConsoleOutputStream.MAX_LINES + 100; i++) {
            bulk.append("line-").append(i).append('\n');
        }

        // when
        stream.write(bulk.toString().getBytes(StandardCharsets.UTF_8));
        drainEdt();

        // then
        assertThat(area.getLineCount()).isLessThanOrEqualTo(ConsoleOutputStream.MAX_LINES);
        assertThat(area.getText()).doesNotContain("line-0");
        assertThat(area.getText()).contains("line-" + (ConsoleOutputStream.MAX_LINES + 99));
    }

    @Test
    void write_fromMultipleThreads_keepsAllLines() throws Exception {
        // given
        Thread first = new Thread(() -> {
            try {
                for (int i = 0; i < 50; i++) {
                    stream.write(("a-" + i + "\n").getBytes(StandardCharsets.UTF_8));
                }
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });
        Thread second = new Thread(() -> {
            try {
                for (int i = 0; i < 50; i++) {
                    stream.write(("b-" + i + "\n").getBytes(StandardCharsets.UTF_8));
                }
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });

        // when
        first.start();
        second.start();
        first.join();
        second.join();
        drainEdt();

        // then
        assertThat(area.getText()).contains("a-49", "b-49");
        assertThat(area.getText().chars().filter(c -> c == '\n').count()).isEqualTo(100);
    }
}
