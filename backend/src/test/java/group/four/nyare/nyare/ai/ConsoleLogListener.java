package group.four.nyare.nyare.ai;

import org.junit.platform.engine.TestExecutionResult;
import org.junit.platform.launcher.TestExecutionListener;
import org.junit.platform.launcher.TestIdentifier;
import org.junit.platform.launcher.TestPlan;

import java.io.*;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class ConsoleLogListener implements TestExecutionListener {

    private static PrintStream originalOut;
    private static PrintStream originalErr;
    private static PrintStream currentOut;
    private static FileOutputStream currentFos;

    @Override
    public void testPlanExecutionStarted(TestPlan testPlan) {
        // Save the real stdout/stderr once per JVM run
        originalOut = System.out;
        originalErr = System.err;
    }

    @Override
    public void executionStarted(TestIdentifier testIdentifier) {
        // We create a separate log file for each test CLASS (container)
        if (testIdentifier.isContainer()) {
            String className = sanitize(testIdentifier.getDisplayName());
            Path logDir = Paths.get("build", "test-logs", className);

            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss");
            String timestamp = LocalDateTime.now().format(formatter);
            String fileName = "console_" + timestamp + ".log";
            Path logFile = logDir.resolve(fileName);

            try {
                Files.createDirectories(logDir);
                currentFos = new FileOutputStream(logFile.toFile(), false); // overwrite per class
                currentOut = new PrintStream(currentFos, true, "UTF-8");
                System.setOut(currentOut);
                System.setErr(currentOut);
            } catch (IOException e) {
                throw new UncheckedIOException(e);
            }
        }
    }

    @Override
    public void executionFinished(TestIdentifier testIdentifier, TestExecutionResult testExecutionResult) {
        if (testIdentifier.isContainer()) {
            // Restore original streams and close the per‑class log
            System.setOut(originalOut);
            System.setErr(originalErr);
            if (currentOut != null) {
                currentOut.close();
            }
            if (currentFos != null) {
                try { currentFos.close(); } catch (IOException ignored) {}
            }
            currentOut = null;
            currentFos = null;
        }
    }

    @Override
    public void testPlanExecutionFinished(TestPlan testPlan) {
        // Safety net: ensure original streams are restored
        System.setOut(originalOut);
        System.setErr(originalErr);
        if (currentOut != null) {
            currentOut.close();
        }
        if (currentFos != null) {
            try { currentFos.close(); } catch (IOException ignored) {}
        }
    }

    private static String sanitize(String name) {
        // Replace characters that are not safe for a directory name
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}