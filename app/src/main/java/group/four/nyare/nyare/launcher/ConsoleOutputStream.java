package group.four.nyare.nyare.launcher;

import java.io.IOException;
import java.io.OutputStream;
import java.io.PrintStream;
import java.nio.charset.StandardCharsets;
import javax.swing.JTextArea;
import javax.swing.JViewport;
import javax.swing.SwingUtilities;
import javax.swing.text.BadLocationException;
import javax.swing.text.Document;
import javax.swing.text.Element;

/**
 * Tee {@link OutputStream} that forwards every byte to the original stream and
 * appends complete lines to a Swing {@link JTextArea}. Line assembly is
 * synchronized and document mutations run on the EDT. The view is capped at
 * {@link #MAX_LINES} lines; older lines are trimmed in batches.
 */
public class ConsoleOutputStream extends OutputStream {

    public static final int MAX_LINES = 2000;
    static final int TRIM_BATCH = 500;

    private final PrintStream original;
    private final JTextArea target;
    private final StringBuilder pending = new StringBuilder();

    public ConsoleOutputStream(PrintStream original, JTextArea target) {
        this.original = original;
        this.target = target;
    }

    @Override
    public synchronized void write(int b) throws IOException {
        write(new byte[] {(byte) b}, 0, 1);
    }

    @Override
    public synchronized void write(byte[] b, int off, int len) throws IOException {
        original.write(b, off, len);
        String chunk = new String(b, off, len, StandardCharsets.UTF_8);
        int newline;
        while ((newline = chunk.indexOf('\n')) >= 0) {
            emit(pending.append(chunk, 0, newline + 1).toString());
            pending.setLength(0);
            chunk = chunk.substring(newline + 1);
        }
        pending.append(chunk);
    }

    @Override
    public synchronized void flush() throws IOException {
        original.flush();
        if (pending.length() > 0) {
            emit(pending.toString());
            pending.setLength(0);
        }
    }

    private void emit(String text) {
        SwingUtilities.invokeLater(() -> {
            boolean atBottom = true;
            if (target.getParent() instanceof JViewport viewport) {
                atBottom = viewport.getViewPosition().y
                        >= target.getHeight() - viewport.getHeight() - 4;
            }
            target.append(text);
            Document document = target.getDocument();
            if (target.getLineCount() > MAX_LINES) {
                Element root = document.getDefaultRootElement();
                try {
                    document.remove(0, root.getElement(TRIM_BATCH).getEndOffset());
                } catch (BadLocationException | IndexOutOfBoundsException e) {
                    // Buffer shrank between check and trim; safe to skip.
                }
            }
            if (atBottom) {
                target.setCaretPosition(document.getLength());
            }
        });
    }
}
