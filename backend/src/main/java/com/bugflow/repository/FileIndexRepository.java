package com.bugflow.repository;

import com.bugflow.model.FileIndex;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FileIndexRepository extends JpaRepository<FileIndex, Long> {
    List<FileIndex> findByRepositoryId(Long repositoryId);
    void deleteByRepositoryId(Long repositoryId);
    long countByRepositoryId(Long repositoryId);

    @Query(value = "SELECT * FROM file_indexes WHERE repository_id = :repoId LIMIT :limit", nativeQuery = true)
    List<FileIndex> findByRepositoryIdWithLimit(@Param("repoId") Long repoId, @Param("limit") int limit);
}
