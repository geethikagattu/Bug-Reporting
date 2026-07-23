package com.bugflow.controller;

import com.bugflow.config.CustomUserPrincipal;
import com.bugflow.model.Bug;
import com.bugflow.service.BugService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bugs")
public class BugController {

    private final BugService bugService;

    public BugController(BugService bugService) {
        this.bugService = bugService;
    }

    @PostMapping
    public ResponseEntity<?> createBug(@RequestBody Map<String, Object> body,
                                       @AuthenticationPrincipal CustomUserPrincipal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("msg", "Unauthorized"));
            }
            String title = (String) body.get("title");
            String description = (String) body.get("description");
            String priority = (String) body.get("priority");
            Long projectId = Long.valueOf(body.get("projectId").toString());

            Bug bug = bugService.createBug(title, description, priority, projectId, principal.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(bug);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("msg", "Server Error"));
        }
    }

    @GetMapping
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<?> getBugs(@RequestParam(required = false) String status,
                                     @RequestParam(required = false) String priority,
                                     @RequestParam(required = false) Long projectId) {
        try {
            List<Bug> bugs = bugService.getBugsWithFilter(status, priority, projectId);
            return ResponseEntity.ok(bugs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("msg", "Server Error"));
        }
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('Tester') or hasRole('Admin')")
    public ResponseEntity<?> getMyBugs(@AuthenticationPrincipal CustomUserPrincipal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("msg", "Unauthorized"));
            }
            List<Bug> bugs = bugService.getMyBugs(principal.getId());
            return ResponseEntity.ok(bugs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("msg", "Server Error"));
        }
    }

    @GetMapping("/assigned")
    @PreAuthorize("hasRole('Developer') or hasRole('Admin')")
    public ResponseEntity<?> getAssignedBugs(@AuthenticationPrincipal CustomUserPrincipal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("msg", "Unauthorized"));
            }
            List<Bug> bugs = bugService.getAssignedBugs(principal.getId());
            return ResponseEntity.ok(bugs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("msg", "Server Error"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBugById(@PathVariable Long id) {
        try {
            Map<String, Object> details = bugService.getBugDetails(id);
            return ResponseEntity.ok(details);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("msg", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("msg", "Server Error"));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBug(@PathVariable Long id,
                                       @RequestBody Map<String, String> body,
                                       @AuthenticationPrincipal CustomUserPrincipal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("msg", "Unauthorized"));
            }
            String title = body.get("title");
            String description = body.get("description");
            String priority = body.get("priority");

            Bug bug = bugService.updateBug(id, title, description, priority, principal.getId(), principal.getRole());
            return ResponseEntity.ok(bug);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("msg", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("msg", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("msg", "Server Error"));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateBugStatus(@PathVariable Long id,
                                             @RequestBody Map<String, String> body,
                                             @AuthenticationPrincipal CustomUserPrincipal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("msg", "Unauthorized"));
            }
            String status = body.get("status");

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

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('Admin')")
    public ResponseEntity<?> deleteBug(@PathVariable Long id) {
        try {
            bugService.deleteBug(id);
            return ResponseEntity.ok(Map.of("msg", "Bug deleted"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("msg", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("msg", "Server Error"));
        }
    }
}
