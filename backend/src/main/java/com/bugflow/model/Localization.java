package com.bugflow.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "localizations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Localization {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bug_id", nullable = false)
    private Long bugId;

    private String fileName;
    private Double relevanceScore;
    private Integer rank;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
