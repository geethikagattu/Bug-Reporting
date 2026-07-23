package com.bugflow.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "commit_histories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommitHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "repository_id", nullable = false)
    private Long repositoryId;

    @Column(nullable = false)
    private String hash;

    @Column(columnDefinition = "TEXT")
    private String message;

    private String authorName;
    private String authorEmail;
    private String authorDate;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
