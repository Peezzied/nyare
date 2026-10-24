package group.four.nyare.nyare;

import group.four.nyare.nyare.launcher.LauncherConfig;
import group.four.nyare.nyare.launcher.LauncherFrame;
import java.awt.GraphicsEnvironment;
import java.util.Arrays;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class NyareApplication {

    public static void main(String[] args) {
        if (isHeadlessMode(args)) {
            LauncherConfig config = LauncherConfig.load();
            String warning = config.missingApiKeyWarning();
            if (warning != null) {
                System.err.println("Warning: " + warning);
            }
            SpringApplication.run(NyareApplication.class,
                    config.toSpringArgs(withoutLauncherFlags(args)));
            return;
        }
        LauncherFrame.launch(withoutLauncherFlags(args));
    }

    static boolean isHeadlessMode(String[] args) {
        return GraphicsEnvironment.isHeadless() || hasLauncherFlag(args);
    }

    private static boolean hasLauncherFlag(String[] args) {
        return Arrays.stream(args)
                .anyMatch(arg -> "--headless".equals(arg) || "--no-gui".equals(arg));
    }

    private static String[] withoutLauncherFlags(String[] args) {
        return Arrays.stream(args)
                .filter(arg -> !"--headless".equals(arg) && !"--no-gui".equals(arg))
                .toArray(String[]::new);
    }

}