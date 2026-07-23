package com.bugflow.controller;

import com.bugflow.config.CustomUserPrincipal;
import com.bugflow.model.Repository;
import com.bugflow.model.User;
import com.bugflow.repository.CommitHistoryRepository;
import com.bugflow.repository.FileIndexRepository;
import com.bugflow.repository.RepositoryRepository;
import com.bugflow.repository.UserRepository;
import com.bugflow.service.GithubService;
import com.bugflow.service.RepoSyncService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/github")
public class GithubController {

    private final GithubService githubService;
    private final RepoSyncService repoSyncService;
    private final UserRepository userRepository;
    private final RepositoryRepository repositoryRepository;
    private final FileIndexRepository fileIndexRepository;
    private final CommitHistoryRepository commitHistoryRepository;

    public GithubController(GithubService githubService,
                            RepoSyncService repoSyncService,
                            UserRepository userRepository,
                            RepositoryRepository repositoryRepository,
                            FileIndexRepository fileIndexRepository,
                            CommitHistoryRepository commitHistoryRepository) {
        this.githubService = githubService;
        this.repoSyncService = repoSyncService;
        this.userRepository = userRepository;
        this.repositoryRepository = repositoryRepository;
        this.fileIndexRepository = fileIndexRepository;
        this.commitHistoryRepository = commitHistoryRepository;
    }

    @GetMapping("/repos")
    public ResponseEntity<?> getRepos(@AuthenticationPrincipal CustomUserPrincipal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
            }
            User user = userRepository.findById(principal.getId()).orElse(null);
            if (user == null || user.getGithubAccessToken() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "GitHub not connected"));
            }

            List<Map<String, Object>> repos = githubService.fetchUserRepos(user.getGithubAccessToken());
            List<Repository> dbRepos = repositoryRepository.findByUserId(user.getId());

            Map<String, String> syncStatusMap = new HashMap<>();
            for (Repository r : dbRepos) {
                syncStatusMap.put(r.getGithubRepoId(), r.getSyncStatus());
            }

            for (Map<String, Object> repo : repos) {
                String repoIdStr = repo.get("id").toString();
                String status = syncStatusMap.getOrDefault(repoIdStr, "Unconnected");
                repo.put("syncStatus", status);
            }

            return ResponseEntity.ok(repos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Failed to fetch repositories"));
        }
    }

    @PostMapping("/select-repo")
    public ResponseEntity<?> selectRepo(@RequestBody Map<String, String> body,
                                        @AuthenticationPrincipal CustomUserPrincipal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
            }
            User user = userRepository.findById(principal.getId()).orElse(null);
            if (user == null || user.getGithubAccessToken() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "No GitHub Access Token"));
            }

            String githubRepoId = body.get("githubRepoId").toString();
            String repoName = body.get("repoName");
            String fullName = body.get("fullName");
            String defaultBranch = body.get("defaultBranch");

            Optional<Repository> existingRepo = repositoryRepository.findByUserIdAndGithubRepoId(user.getId(), githubRepoId);
            if (existingRepo.isPresent()) {
                Repository r = existingRepo.get();
                if ("Syncing".equals(r.getSyncStatus()) || "Ready".equals(r.getSyncStatus())) {
                    return ResponseEntity.ok(Map.of("message", "Repository already synced or syncing", "status", r.getSyncStatus()));
                }
            }

            // Generate a unique taskId/jobId
            String jobId = UUID.randomUUID().toString();

            // Trigger sync asynchronously
            repoSyncService.syncRepository(user.getId(), githubRepoId, repoName, fullName, defaultBranch, user.getGithubAccessToken());

            return ResponseEntity.ok(Map.of("message", "Sync started", "jobId", jobId, "status", "Syncing"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Failed to start sync"));
        }
    }

    @GetMapping("/repo-data/{repoId}")
    public ResponseEntity<?> getRepoData(@PathVariable String repoId,
                                         @AuthenticationPrincipal CustomUserPrincipal principal) {
        try {
            if (principal == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Unauthorized"));
            }
            Repository repo = repositoryRepository.findByGithubRepoIdAndUserId(repoId, principal.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Repository not found"));

            long fileCount = fileIndexRepository.countByRepositoryId(repo.getId());
            long commitCount = commitHistoryRepository.countByRepositoryId(repo.getId());

            Map<String, Object> res = new HashMap<>();
            res.put("status", repo.getSyncStatus());
            res.put("lastSyncedAt", repo.getLastSyncedAt());
            res.put("stats", Map.of("files", fileCount, "commits", commitCount));

            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", "Failed to fetch repository details"));
        }
    }
}
