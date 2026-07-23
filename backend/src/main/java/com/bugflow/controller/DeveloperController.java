package com.bugflow.controller;

import com.bugflow.config.CustomUserPrincipal;
import com.bugflow.model.Bug;
import com.bugflow.service.BugService;
import com.bugflow.service.DeveloperService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/developer")
@PreAuthorize("hasRole('Developer')")
public class DeveloperController {

    private final DeveloperService developerService;
    private final BugService bugService;

    public DeveloperController(DeveloperService developerService, BugService bugService) {
        this.developerService = developerService;
        this.bugService = bugService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard(@AuthenticationPrincipal CustomUserPrincipal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("msg", "Unauthorized"));
            }
            Map<String, Object> stats = developerService.getDeveloperDashboardStats(principal.getId());
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("msg", "Server Error"));
        }
    }

    @GetMapping("/bugs")
    public ResponseEntity<?> getBugs(@AuthenticationPrincipal CustomUserPrincipal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("msg", "Unauthorized"));
            }
            List<Bug> bugs = developerService.getBugsAssignedTo(principal.getId());
            return ResponseEntity.ok(bugs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("msg", "Server Error"));
        }
    }

    @GetMapping("/bugs/{id}")
    public ResponseEntity<?> getBugDetails(@PathVariable Long id, @AuthenticationPrincipal CustomUserPrincipal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("msg", "Unauthorized"));
            }
            
            // Check authorization: make sure the bug is assigned to this developer
            Map<String, Object> details = bugService.getBugDetails(id);
            Map<?, ?> assignee = (Map<?, ?>) details.get("assignedTo");
            if (assignee == null || !principal.getId().equals(Long.valueOf(assignee.get("id").toString()))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("msg", "Bug not found or not assigned to you"));
            }

            return ResponseEntity.ok(details);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("msg", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("msg", "Server Error"));
        }
    }

    @PutMapping("/bugs/{id}/status")
    public ResponseEntity<?> updateBugStatus(@PathVariable Long id,
                                             @RequestBody Map<String, String> body,
                                             @AuthenticationPrincipal CustomUserPrincipal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("msg", "Unauthorized"));
            }
            String status = body.get("status");

            // Custom checks inside service: assignee or admin
            Bug bug = bugService.updateBugStatus(id, status, principal.getId(), principal.getRole());
            return ResponseEntity.ok(bug);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("msg", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("msg", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("msg", "Server Error"));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory(@AuthenticationPrincipal CustomUserPrincipal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("msg", "Unauthorized"));
            }
            List<Bug> resolvedBugs = developerService.getResolvedBugsHistory(principal.getId());
            return ResponseEntity.ok(resolvedBugs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("msg", "Server Error"));
        }
    }
}
