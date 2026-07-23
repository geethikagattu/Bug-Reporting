package com.bugflow.repository;

import com.bugflow.model.Classification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ClassificationRepository extends JpaRepository<Classification, Long> {
    Optional<Classification> findByBugId(Long bugId);
}
