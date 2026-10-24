package group.four.nyare.nyare.ai;

import org.junit.platform.engine.TestExecutionResult;
import org.junit.platform.launcher.TestExecutionListener;
import org.junit.platform.launcher.TestIdentifier;
import org.junit.platform.launcher.TestPlan;

import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.io.PrintStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class ConsoleLogListener implements TestExecutionListener {

    private static PrintStream originalOut;
    private static PrintStream originalErr;
    private static PrintStream currentOut;
    private static PrintStream currentErr;
    private static FileOutputStream currentFos;

    @Override
    public void testPlanExecutionStarted(TestPlan testPlan) {
        originalOut = System.out;
        originalErr = System.err;
    }

    @Override
    public void executionStarted(TestIdentifier testIdentifier) {
        if (testIdentifier.isContainer()) {
            if (originalOut == null) {
                originalOut = System.out;
            }
            if (originalErr == null) {
                originalErr = System.err;
            }

            String className = sanitize(testIdentifier.getDisplayName());
            Path logDir = Paths.get("build", "test-logs", className);

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss");
            String timestamp = LocalDateTime.now().format(formatter);
            String fileName = "console_" + timestamp + ".log";
            Path logFile = logDir.resolve(fileName);

            try {
                Files.createDirectories(logDir);
                currentFos = new FileOutputStream(logFile.toFile(), false);
                currentOut = new PrintStream(new DualOutputStream(originalOut, currentFos), true, StandardCharsets.UTF_8);
                currentErr = new PrintStream(new DualOutputStream(originalErr, currentFos), true, StandardCharsets.UTF_8);
                System.setOut(currentOut);
                System.setErr(currentErr);
            } catch (IOException e) {
                throw new UncheckedIOException(e);
            }
        }
    }

    @Override
    public void executionFinished(TestIdentifier testIdentifier, TestExecutionResult testExecutionResult) {
        if (testIdentifier.isContainer()) {
            restoreStreams();
            closeResources();
        }
    }

    @Override
    public void testPlanExecutionFinished(TestPlan testPlan) {
        restoreStreams();
        closeResources();
    }

    private static void restoreStreams() {
        if (originalOut != null) {
            System.setOut(originalOut);
        }
        if (originalErr != null) {
            System.setErr(originalErr);
        }
    }

    private static void closeResources() {
        if (currentOut != null) {
            currentOut.flush();
        }
        if (currentErr != null) {
            currentErr.flush();
        }
        if (currentFos != null) {
            try {
                currentFos.close();
            } catch (IOException ignored) {
            }
        }
        currentOut = null;
        currentErr = null;
        currentFos = null;
    }

    private static String sanitize(String name) {
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private static class DualOutputStream extends OutputStream {
        private final OutputStream console;
        private final OutputStream file;

        DualOutputStream(OutputStream console, OutputStream file) {
            this.console = console;
            this.file = file;
        }

        @Override
        public void write(int b) throws IOException {
            console.write(b);
            file.write(b);
        }

        @Override
        public void write(byte[] b, int off, int len) throws IOException {
            console.write(b, off, len);
            file.write(b, off, len);
        }

        @Override
        public void flush() throws IOException {
            console.flush();
            file.flush();
        }
    }
}