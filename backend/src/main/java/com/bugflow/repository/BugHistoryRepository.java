package com.bugflow.repository;

import com.bugflow.model.BugHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BugHistoryRepository extends JpaRepository<BugHistory, Long> {
    List<BugHistory> findByBugIdOrderByUpdatedAtAsc(Long bugId);
}
