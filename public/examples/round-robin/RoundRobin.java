import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

final class RoundRobin {
    private final List<String> servers;
    private final AtomicInteger index = new AtomicInteger();

    RoundRobin(List<String> servers) {
        this.servers = List.copyOf(servers);
        if (this.servers.isEmpty()) {
            throw new IllegalArgumentException("At least one server is required");
        }
    }

    String next() {
        int last = servers.size() - 1;
        int current = index.getAndUpdate(i -> i == last ? 0 : i + 1);
        return servers.get(current);
    }
}
