package com.bugflow.controller;

import com.bugflow.config.CustomUserPrincipal;
import com.bugflow.model.Project;
import com.bugflow.service.ProjectService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public ResponseEntity<?> getAllProjects() {
        try {
            List<Project> projects = projectService.getAllProjects();
            List<Map<String, Object>> mappedProjects = projects.stream().map(p -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", p.getId());
                map.put("name", p.getName());
                map.put("description", p.getDescription());
                map.put("repositoryUrl", p.getRepositoryUrl());
                if (p.getOwner() != null) {
                    map.put("owner", Map.of("id", p.getOwner().getId(), "name", p.getOwner().getName(), "email", p.getOwner().getEmail()));
                }
                return map;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(mappedProjects);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("msg", "Server Error"));
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<?> createProject(@RequestBody Map<String, String> body,
                                           @AuthenticationPrincipal CustomUserPrincipal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("msg", "Unauthorized"));
            }
            String name = body.get("name");
            String description = body.get("description");
            String repositoryUrl = body.get("repositoryUrl");

            Project project = projectService.createProject(name, description, repositoryUrl, principal.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(project);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("msg", "Server Error"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProjectById(@PathVariable Long id) {
        try {
            Project p = projectService.getProjectById(id);
            Map<String, Object> map = new HashMap<>();
            map.put("id", p.getId());
            map.put("name", p.getName());
            map.put("description", p.getDescription());
            map.put("repositoryUrl", p.getRepositoryUrl());
            if (p.getOwner() != null) {
                map.put("owner", Map.of("id", p.getOwner().getId(), "name", p.getOwner().getName(), "email", p.getOwner().getEmail()));
            }
            return ResponseEntity.ok(map);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("msg", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("msg", "Server Error"));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<?> updateProject(@PathVariable Long id, @RequestBody Project project) {
        try {
            Project updated = projectService.updateProject(id, project);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("msg", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("msg", "Server Error"));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<?> deleteProject(@PathVariable Long id) {
        try {
            projectService.deleteProject(id);
            return ResponseEntity.ok(Map.of("msg", "Project deleted"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("msg", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("msg", "Server Error"));
        }
    }

    @PostMapping("/{id}/members")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<?> addMember(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("msg", "Member added (mock)"));
    }

    @DeleteMapping("/{id}/members/{userId}")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<?> removeMember(@PathVariable Long id, @PathVariable Long userId) {
        return ResponseEntity.ok(Map.of("msg", "Member removed (mock)"));
    }
}
