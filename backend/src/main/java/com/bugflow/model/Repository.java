package com.bugflow.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "repositories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Repository {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String githubRepoId;

    private String name;
    private String fullName;
    private String defaultBranch;

    @Column(nullable = false)
    private String syncStatus = "Unconnected"; // "Unconnected", "Syncing", "Ready", "Failed"

    private LocalDateTime lastSyncedAt;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
