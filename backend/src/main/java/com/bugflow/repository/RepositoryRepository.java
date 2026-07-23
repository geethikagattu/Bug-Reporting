package com.bugflow.repository;

import com.bugflow.model.Repository;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RepositoryRepository extends JpaRepository<Repository, Long> {
    Optional<Repository> findByUserIdAndGithubRepoId(Long userId, String githubRepoId);
    Optional<Repository> findByGithubRepoIdAndUserId(String githubRepoId, Long userId);
    List<Repository> findByUserId(Long userId);
}
