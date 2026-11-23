import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class RoundRobinTest {
    @Test
    void rotatesInOrder() {
        var rr = new RoundRobin(List.of("A", "B"));
        assertEquals(List.of("A", "B", "A", "B"),
            List.of(rr.next(), rr.next(), rr.next(), rr.next()));
    }

    @Test
    void rejectsEmptyConfiguration() {
        assertThrows(IllegalArgumentException.class,
            () -> new RoundRobin(List.of()));
    }

    @Test
    void wrapsFromLastServerToFirst() {
        var rr = new RoundRobin(List.of("A", "B", "C"));
        assertEquals(List.of("A", "B", "C", "A"),
            List.of(rr.next(), rr.next(), rr.next(), rr.next()));
        assertEquals(1, Math.floorMod(Integer.MAX_VALUE, 3));
        assertEquals(1, Math.floorMod(Integer.MIN_VALUE, 3));
    }

    @Test
    void distributesTwoHundredCalls() throws Exception {
        var rr = new RoundRobin(List.of("A", "B"));
        var ready = new CountDownLatch(8);
        var start = new CountDownLatch(1);
        List<Future<List<String>>> batches = new ArrayList<>();

        try (var pool = Executors.newFixedThreadPool(8)) {
            try {
                for (int worker = 0; worker < 8; worker++) {
                    batches.add(pool.submit(() -> {
                        ready.countDown();
                        start.await();
                        List<String> picks = new ArrayList<>();
                        for (int i = 0; i < 25; i++) picks.add(rr.next());
                        return picks;
                    }));
                }
                assertTrue(ready.await(5, TimeUnit.SECONDS));
                start.countDown();

                List<String> results = new ArrayList<>();
                for (var batch : batches) {
                    results.addAll(batch.get(5, TimeUnit.SECONDS));
                }
                assertEquals(100L, results.stream().filter("A"::equals).count());
                assertEquals(100L, results.stream().filter("B"::equals).count());
            } finally {
                start.countDown();
                pool.shutdownNow();
            }
        }
    }
}
