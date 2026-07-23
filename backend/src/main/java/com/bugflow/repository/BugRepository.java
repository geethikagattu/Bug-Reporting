package com.bugflow.repository;

import com.bugflow.model.Bug;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BugRepository extends JpaRepository<Bug, Long> {
    List<Bug> findByReporterId(Long reporterId);
    List<Bug> findByAssignedToId(Long assignedToId);
    List<Bug> findByAssignedToIdAndStatus(Long assignedToId, String status);

    @Query("SELECT b FROM Bug b WHERE " +
           "(:status IS NULL OR b.status = :status) AND " +
           "(:priority IS NULL OR b.priority = :priority) AND " +
           "(:projectId IS NULL OR b.project.id = :projectId)")
    List<Bug> findBugsWithFilter(@Param("status") String status,
                                 @Param("priority") String priority,
                                 @Param("projectId") Long projectId);

    long countByStatus(String status);
}
