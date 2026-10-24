package group.four.nyare.nyare.dev;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * Logs the dev audit trace console URL once the application is ready.
 */
@Component
public class DevConsoleUrlLogger {

    private static final Logger log = LoggerFactory.getLogger(DevConsoleUrlLogger.class);

    /**
     * Prints the console URL after startup.
     *
     * @param event the application-ready event
     */
    @EventListener
    public void onApplicationReady(ApplicationReadyEvent event) {
        Environment env = event.getApplicationContext().getEnvironment();
        String port = env.getProperty("local.server.port", env.getProperty("server.port", "8080"));
        log.info("Audit trace console: http://localhost:{}/dev/audit-trace", port);
    }
}
