package com.bugflow.controller;

import com.bugflow.config.CustomUserPrincipal;
import com.bugflow.model.*;
import com.bugflow.service.AdminService;
import com.bugflow.service.BugService;
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
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('Admin')")
public class AdminController {

    private final AdminService adminService;
    private final BugService bugService;
    private final ProjectService projectService;

    public AdminController(AdminService adminService, BugService bugService, ProjectService projectService) {
        this.adminService = adminService;
        this.bugService = bugService;
        this.projectService = projectService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard() {
        try {
            Map<String, Object> stats = adminService.getDashboardStats();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("msg", "Server Error"));
        }
    }

    @GetMapping("/users")
    public ResponseEntity<?> getUsers() {
        try {
            List<User> users = adminService.getAllUsers();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("msg", "Server Error"));
        }
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> body) {
        try {
            String name = body.get("name");
            String email = body.get("email");
            String password = body.get("password");
            String userRole = body.get("userRole"); // Front-end uses userRole

            User created = adminService.createUser(name, email, password, userRole);
            created.setPassword(null);
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("msg", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("msg", "Server Error"));
        }
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody User user) {
        try {
            User updated = adminService.updateUser(id, user);
            updated.setPassword(null);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("msg", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("msg", "Server Error"));
        }
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            adminService.deleteUser(id);
            return ResponseEntity.ok(Map.of("msg", "User deleted"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("msg", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("msg", "Server Error"));
        }
    }

    @GetMapping("/bugs")
    public ResponseEntity<?> getBugs() {
        try {
            List<Bug> bugs = bugService.getBugsWithFilter(null, null, null);
            return ResponseEntity.ok(bugs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("msg", "Server Error"));
        }
    }

    @GetMapping("/assignments")
    public ResponseEntity<?> getAssignments() {
        try {
            List<Assignment> assignments = adminService.getAllAssignments();
            List<Map<String, Object>> mapped = assignments.stream().map(a -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", a.getId());
                map.put("assignedBy", a.getAssignedBy());
                map.put("createdAt", a.getCreatedAt());
                if (a.getDeveloper() != null) {
                    map.put("developer", Map.of("name", a.getDeveloper().getName()));
                }
                
                // Get Bug detail
                try {
                    Map<String, Object> bugDetails = bugService.getBugDetails(a.getBugId());
                    map.put("bug", bugDetails);
                } catch (Exception ex) {
                    map.put("bug", Map.of("title", "Unknown", "status", "Unknown"));
                }
                
                return map;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(mapped);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("msg", "Server Error"));
        }
    }

    @PutMapping("/assignments/{id}/override")
    public ResponseEntity<?> overrideAssignment(@PathVariable Long id,
                                                @RequestBody Map<String, Object> body,
                                                @AuthenticationPrincipal CustomUserPrincipal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("msg", "Unauthorized"));
            }
            Long newDeveloperId = Long.valueOf(body.get("newDeveloperId").toString());

            adminService.overrideAssignment(id, newDeveloperId, principal.getId());
            return ResponseEntity.ok(Map.of("msg", "Assignment overridden successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("msg", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("msg", "Server Error"));
        }
    }

    @GetMapping("/reports")
    public ResponseEntity<?> getReports() {
        try {
            List<Bug> bugs = bugService.getBugsWithFilter(null, null, null);
            List<Map<String, Object>> mappedBugs = bugs.stream().map(b -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", b.getId());
                map.put("title", b.getTitle());
                map.put("status", b.getStatus());
                map.put("priority", b.getPriority());
                map.put("createdAt", b.getCreatedAt());
                if (b.getProject() != null) {
                    map.put("project", Map.of("name", b.getProject().getName()));
                }
                return map;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(mappedBugs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("msg", "Server Error"));
        }
    }

    @GetMapping("/projects")
    public ResponseEntity<?> getProjects() {
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
}
