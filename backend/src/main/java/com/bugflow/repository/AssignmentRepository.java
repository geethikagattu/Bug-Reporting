package com.bugflow.repository;

import com.bugflow.model.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    Optional<Assignment> findByBugId(Long bugId);
    void deleteByBugId(Long bugId);
}
