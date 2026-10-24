package group.four.nyare.nyare.launcher;

import group.four.nyare.nyare.NyareApplication;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Desktop;
import java.awt.FlowLayout;
import java.awt.GridBagConstraints;
import java.awt.GridBagLayout;
import java.awt.Insets;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.io.IOException;
import java.io.PrintStream;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutionException;
import javax.swing.BoxLayout;
import javax.swing.JButton;
import javax.swing.JCheckBox;
import javax.swing.JComboBox;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.JPasswordField;
import javax.swing.JScrollPane;
import javax.swing.JTextArea;
import javax.swing.JTextField;
import javax.swing.SwingUtilities;
import javax.swing.SwingWorker;
import javax.swing.UIManager;
import javax.swing.border.EmptyBorder;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;

/**
 * Swing launcher window for the bundled server. Starts and stops the Spring
 * context on a worker thread, streams console output into an embedded log
 * view, and persists settings to {@code nyare.properties}.
 */
public class LauncherFrame extends JFrame {

    enum ServerState {
        STOPPED,
        STARTING,
        RUNNING,
        STOPPING,
        ERROR
    }

    private static final Color STOPPED_COLOR = new Color(0x55, 0x55, 0x55);
    private static final Color BUSY_COLOR = new Color(0xB0, 0x6A, 0x00);
    private static final Color RUNNING_COLOR = new Color(0x00, 0x7A, 0x33);
    private static final Color ERROR_COLOR = new Color(0xB0, 0x00, 0x00);

    private final JLabel statusLabel = new JLabel();
    private final JLabel warningLabel = new JLabel(" ");
    private final JComboBox<String> providerCombo = new JComboBox<>(new String[] {"google", "groq"});
    private final JPasswordField googleKeyField = new JPasswordField(24);
    private final JPasswordField groqKeyField = new JPasswordField(24);
    private final JCheckBox googleShowKey = new JCheckBox("Show");
    private final JCheckBox groqShowKey = new JCheckBox("Show");
    private final JTextField portField = new JTextField(8);
    private final JCheckBox autoOpenCheck = new JCheckBox("Open browser when the server starts");
    private final JCheckBox observabilityCheck =
            new JCheckBox("Enable observability console (/dev/observability)");
    private final JButton toggleButton = new JButton("Start Server");
    private final JButton openBrowserButton = new JButton("Open in Browser");
    private final JButton clearLogsButton = new JButton("Clear Logs");
    private final JButton zoomOutButton = new JButton("A\u2212");
    private final JButton zoomInButton = new JButton("A+");
    private final JTextArea logArea = new JTextArea();
    private int logFontSize;

    private final char googleEchoChar = googleKeyField.getEchoChar();
    private final char groqEchoChar = groqKeyField.getEchoChar();

    private LauncherConfig config;
    private String[] appArgs = new String[0];
    private volatile ConfigurableApplicationContext context;
    private ServerState state = ServerState.STOPPED;

    /** Opens the launcher window on the EDT and loads persisted settings. */
    public static void launch(String[] args) {
        SwingUtilities.invokeLater(() -> {
            try {
                UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
            } catch (Exception e) {
                // Keep the default cross-platform look and feel.
            }
            LauncherFrame frame = new LauncherFrame();
            frame.bind(LauncherConfig.load(), args);
            frame.setVisible(true);
        });
    }

    public LauncherFrame() {
        super("Nyare Server Launcher");
        redirectSystemStreams();
        buildLayout();
        bindActions();
        setState(ServerState.STOPPED);
        setSize(720, 560);
        setLocationRelativeTo(null);
        setDefaultCloseOperation(DO_NOTHING_ON_CLOSE);
        addWindowListener(new WindowAdapter() {
            @Override
            public void windowClosing(WindowEvent e) {
                shutdownAndExit();
            }
        });
    }

    /** Populates the form fields from the loaded configuration. */
    private void bind(LauncherConfig config, String[] appArgs) {
        this.config = config;
        this.appArgs = appArgs;
        providerCombo.setSelectedItem(config.getAiProvider());
        googleKeyField.setText(config.getGoogleApiKey());
        groqKeyField.setText(config.getGroqApiKey());
        portField.setText(String.valueOf(config.getServerPort()));
        autoOpenCheck.setSelected(config.isBrowserAutoOpen());
        observabilityCheck.setSelected(config.isObservability());
    }

    private void redirectSystemStreams() {
        logArea.setEditable(false);
        logFontSize = logArea.getFont().getSize();
        PrintStream out = new PrintStream(
                new ConsoleOutputStream(System.out, logArea), true, StandardCharsets.UTF_8);
        PrintStream err = new PrintStream(
                new ConsoleOutputStream(System.err, logArea), true, StandardCharsets.UTF_8);
        System.setOut(out);
        System.setErr(err);
    }

    private void buildLayout() {
        JPanel root = new JPanel(new BorderLayout(8, 8));
        root.setBorder(new EmptyBorder(10, 10, 10, 10));

        statusLabel.setBorder(new EmptyBorder(0, 0, 6, 0));
        warningLabel.setForeground(BUSY_COLOR);
        JPanel header = new JPanel();
        header.setLayout(new BoxLayout(header, BoxLayout.Y_AXIS));
        header.add(statusLabel);
        header.add(warningLabel);
        root.add(header, BorderLayout.NORTH);

        JPanel form = new JPanel(new GridBagLayout());
        GridBagConstraints label = new GridBagConstraints();
        label.anchor = GridBagConstraints.WEST;
        label.insets = new Insets(2, 0, 2, 8);
        GridBagConstraints field = new GridBagConstraints();
        field.gridx = 1;
        field.weightx = 1.0;
        field.fill = GridBagConstraints.HORIZONTAL;
        field.insets = new Insets(2, 0, 2, 0);

        int row = 0;
        label.gridy = row;
        field.gridy = row;
        form.add(new JLabel("AI Provider"), label);
        form.add(providerCombo, field);

        row++;
        label.gridy = row;
        field.gridy = row;
        form.add(new JLabel("Google API Key"), label);
        form.add(keyRow(googleKeyField, googleShowKey), field);

        row++;
        label.gridy = row;
        field.gridy = row;
        form.add(new JLabel("Groq API Key"), label);
        form.add(keyRow(groqKeyField, groqShowKey), field);

        row++;
        label.gridy = row;
        field.gridy = row;
        form.add(new JLabel("Server Port"), label);
        form.add(portField, field);

        row++;
        field.gridy = row;
        form.add(autoOpenCheck, field);

        row++;
        field.gridy = row;
        form.add(observabilityCheck, field);

        JPanel center = new JPanel(new BorderLayout(8, 8));
        center.add(form, BorderLayout.NORTH);
        JScrollPane logScroll = new JScrollPane(logArea);
        center.add(logScroll, BorderLayout.CENTER);
        root.add(center, BorderLayout.CENTER);

        JPanel controls = new JPanel(new FlowLayout(FlowLayout.LEFT, 8, 0));
        controls.add(toggleButton);
        controls.add(openBrowserButton);
        controls.add(clearLogsButton);
        controls.add(zoomOutButton);
        controls.add(zoomInButton);
        root.add(controls, BorderLayout.SOUTH);

        setContentPane(root);
    }

    private JPanel keyRow(JPasswordField keyField, JCheckBox showToggle) {
        JPanel row = new JPanel(new BorderLayout(4, 0));
        row.add(keyField, BorderLayout.CENTER);
        row.add(showToggle, BorderLayout.EAST);
        return row;
    }

    private void bindActions() {
        googleShowKey.addActionListener(
                e -> googleKeyField.setEchoChar(googleShowKey.isSelected() ? (char) 0 : googleEchoChar));
        groqShowKey.addActionListener(
                e -> groqKeyField.setEchoChar(groqShowKey.isSelected() ? (char) 0 : groqEchoChar));
        toggleButton.addActionListener(e -> {
            if (state == ServerState.RUNNING) {
                stopServer(null);
            } else {
                startServer();
            }
        });
        openBrowserButton.addActionListener(e -> openBrowser());
        clearLogsButton.addActionListener(e -> logArea.setText(""));
        zoomOutButton.addActionListener(e -> zoomLog(-1));
        zoomInButton.addActionListener(e -> zoomLog(1));
        logArea.addMouseWheelListener(e -> {
            if ((e.getModifiersEx() & java.awt.event.InputEvent.CTRL_DOWN_MASK) != 0) {
                zoomLog(-e.getWheelRotation());
                e.consume();
            }
        });
    }

    /** Adjusts the console log font size within a bounded range. */
    private void zoomLog(int delta) {
        logFontSize = Math.max(8, Math.min(36, logFontSize + delta));
        logArea.setFont(logArea.getFont().deriveFont((float) logFontSize));
    }

    /** Copies the form values into the configuration and persists the file. */
    private boolean applyFormToConfig() {
        try {
            config.setServerPort(Integer.parseInt(portField.getText().trim()));
        } catch (IllegalArgumentException e) {
            System.err.println("Invalid server port: " + portField.getText()
                    + " (expected " + LauncherConfig.MIN_PORT + "-" + LauncherConfig.MAX_PORT + ")");
            setState(ServerState.ERROR);
            return false;
        }
        config.setAiProvider((String) providerCombo.getSelectedItem());
        config.setGoogleApiKey(new String(googleKeyField.getPassword()));
        config.setGroqApiKey(new String(groqKeyField.getPassword()));
        config.setBrowserAutoOpen(autoOpenCheck.isSelected());
        config.setObservability(observabilityCheck.isSelected());
        try {
            config.save();
        } catch (IOException e) {
            System.err.println("Could not save nyare.properties: " + e.getMessage());
        }
        return true;
    }

    private void startServer() {
        if (!applyFormToConfig()) {
            return;
        }
        String warning = config.missingApiKeyWarning();
        warningLabel.setText(warning == null ? " " : "Warning: " + warning);
        if (warning != null) {
            System.err.println("Warning: " + warning);
        }
        setState(ServerState.STARTING);
        String[] springArgs = config.toSpringArgs(appArgs);
        new SwingWorker<ConfigurableApplicationContext, Void>() {
            @Override
            protected ConfigurableApplicationContext doInBackground() {
                return new SpringApplicationBuilder(NyareApplication.class)
                        .headless(false)
                        .run(springArgs);
            }

            @Override
            protected void done() {
                try {
                    context = get();
                    if (state == ServerState.STOPPING) {
                        context.close();
                        context = null;
                        return;
                    }
                    String warning = config.missingApiKeyWarning(context.getEnvironment());
                    warningLabel.setText(warning == null ? " " : "Warning: " + warning);
                    setState(ServerState.RUNNING);
                    if (config.isBrowserAutoOpen()) {
                        openBrowser();
                    }
                } catch (InterruptedException | ExecutionException e) {
                    Throwable cause = e instanceof ExecutionException ? e.getCause() : e;
                    cause.printStackTrace();
                    context = null;
                    setState(ServerState.ERROR);
                }
            }
        }.execute();
    }

    private void stopServer(Runnable after) {
        setState(ServerState.STOPPING);
        new SwingWorker<Void, Void>() {
            @Override
            protected Void doInBackground() {
                ConfigurableApplicationContext running = context;
                if (running != null) {
                    running.close();
                    context = null;
                }
                return null;
            }

            @Override
            protected void done() {
                setState(ServerState.STOPPED);
                if (after != null) {
                    after.run();
                }
            }
        }.execute();
    }

    private void shutdownAndExit() {
        setState(ServerState.STOPPING);
        stopServer(() -> {
            dispose();
            System.exit(0);
        });
    }

    private void openBrowser() {
        try {
            if (Desktop.isDesktopSupported()
                    && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
                Desktop.getDesktop().browse(new URI("http://localhost:" + config.getServerPort()));
            } else {
                System.err.println("Desktop browsing is not supported on this system.");
            }
        } catch (Exception e) {
            System.err.println("Could not open the browser: " + e.getMessage());
        }
    }

    private void setState(ServerState next) {
        state = next;
        switch (next) {
            case STOPPED -> {
                statusLabel.setText("Status: Stopped");
                statusLabel.setForeground(STOPPED_COLOR);
                toggleButton.setText("Start Server");
                toggleButton.setEnabled(true);
            }
            case STARTING -> {
                statusLabel.setText("Status: Starting server...");
                statusLabel.setForeground(BUSY_COLOR);
                toggleButton.setText("Starting...");
                toggleButton.setEnabled(false);
            }
            case RUNNING -> {
                statusLabel.setText("Status: Running at http://localhost:" + config.getServerPort());
                statusLabel.setForeground(RUNNING_COLOR);
                toggleButton.setText("Stop Server");
                toggleButton.setEnabled(true);
            }
            case STOPPING -> {
                statusLabel.setText("Status: Stopping...");
                statusLabel.setForeground(BUSY_COLOR);
                toggleButton.setText("Stopping...");
                toggleButton.setEnabled(false);
            }
            case ERROR -> {
                statusLabel.setText("Status: Startup Failed");
                statusLabel.setForeground(ERROR_COLOR);
                toggleButton.setText("Start Server");
                toggleButton.setEnabled(true);
            }
        }
        boolean editable = next == ServerState.STOPPED || next == ServerState.ERROR;
        providerCombo.setEnabled(editable);
        googleKeyField.setEnabled(editable);
        groqKeyField.setEnabled(editable);
        googleShowKey.setEnabled(editable);
        groqShowKey.setEnabled(editable);
        portField.setEnabled(editable);
        autoOpenCheck.setEnabled(editable);
        observabilityCheck.setEnabled(editable);
        openBrowserButton.setEnabled(next == ServerState.RUNNING);
    }
}
