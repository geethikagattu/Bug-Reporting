package com.bugflow.repository;

import com.bugflow.model.CommitHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CommitHistoryRepository extends JpaRepository<CommitHistory, Long> {
    List<CommitHistory> findByRepositoryId(Long repositoryId);
    Optional<CommitHistory> findByRepositoryIdAndHash(Long repositoryId, String hash);
    long countByRepositoryId(Long repositoryId);
}
