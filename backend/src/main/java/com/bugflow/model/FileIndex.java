package com.bugflow.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "file_indexes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileIndex {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "repository_id", nullable = false)
    private Long repositoryId;

    @Column(nullable = false, length = 1024)
    private String path;

    private String name;
    private Long size;
    private String sha;
    private String extension;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
