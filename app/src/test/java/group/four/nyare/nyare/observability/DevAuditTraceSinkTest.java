package group.four.nyare.nyare.observability;

import group.four.nyare.nyare.ai.observability.event.AuditCategory;
import group.four.nyare.nyare.ai.observability.event.AuditSeverity;
import group.four.nyare.nyare.ai.observability.event.AuditTraceEvent;
import group.four.nyare.nyare.observability.sink.DevAuditTraceSink;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;

class DevAuditTraceSinkTest {

    private final DevAuditTraceSink sink = new DevAuditTraceSink();

    @Test
    void snapshot_withMultipleEvents_returnsNewestFirst() {
        // given
        sink.onAuditTraceEvent(event("first"));
        sink.onAuditTraceEvent(event("second"));
        sink.onAuditTraceEvent(event("third"));

        // when
        List<AuditTraceEvent> snapshot = sink.snapshot();

        // then
        assertThat(snapshot)
                .extracting(AuditTraceEvent::message)
                .containsExactly("third", "second", "first");
    }

    @Test
    void onAuditTraceEvent_whenBufferOverflows_dropsOldestEvents() {
        // given
        IntStream.range(0, 600)
                .forEach(i -> sink.onAuditTraceEvent(event("event-" + i)));

        // when
        List<AuditTraceEvent> snapshot = sink.snapshot();

        // then
        assertThat(snapshot).hasSize(500);
        assertThat(snapshot.getFirst().message()).isEqualTo("event-599");
        assertThat(snapshot.getLast().message()).isEqualTo("event-100");
    }

    @Test
    void onAuditTraceEvent_withConcurrentPublishers_staysWithinCapacity() throws InterruptedException {
        // given
        int threads = 4;
        int eventsPerThread = 250;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch ready = new CountDownLatch(threads);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(threads);

        // when
        for (int t = 0; t < threads; t++) {
            int threadIndex = t;
            executor.submit(() -> {
                ready.countDown();
                try {
                    start.await();
                    for (int i = 0; i < eventsPerThread; i++) {
                        sink.onAuditTraceEvent(event("t" + threadIndex + "-e" + i));
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    done.countDown();
                }
            });
        }
        assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue();
        start.countDown();
        assertThat(done.await(30, TimeUnit.SECONDS)).isTrue();
        executor.shutdown();

        // then
        List<AuditTraceEvent> snapshot = sink.snapshot();
        assertThat(snapshot.size()).isLessThanOrEqualTo(500);
        assertThat(snapshot)
                .extracting(AuditTraceEvent::id)
                .doesNotHaveDuplicates();
        assertThat(snapshot).allSatisfy(e -> assertThat(e.message()).startsWith("t"));
    }

    private AuditTraceEvent event(String message) {
        return new AuditTraceEvent(
                UUID.randomUUID(),
                Instant.now(),
                AuditCategory.LIFECYCLE,
                AuditSeverity.INFO,
                message,
                null, null, null, null, null, null, null,
                null, null, null, null, null, null,
                null, null, null, null, null, null);
    }
}
