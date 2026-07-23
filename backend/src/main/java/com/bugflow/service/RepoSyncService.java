package com.bugflow.service;

import com.bugflow.model.CommitHistory;
import com.bugflow.model.FileIndex;
import com.bugflow.model.Repository;
import com.bugflow.repository.CommitHistoryRepository;
import com.bugflow.repository.FileIndexRepository;
import com.bugflow.repository.RepositoryRepository;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class RepoSyncService {

    private final RepositoryRepository repositoryRepository;
    private final FileIndexRepository fileIndexRepository;
    private final CommitHistoryRepository commitHistoryRepository;
    private final RestTemplate restTemplate;

    public RepoSyncService(RepositoryRepository repositoryRepository,
                           FileIndexRepository fileIndexRepository,
                           CommitHistoryRepository commitHistoryRepository) {
        this.repositoryRepository = repositoryRepository;
        this.fileIndexRepository = fileIndexRepository;
        this.commitHistoryRepository = commitHistoryRepository;
        this.restTemplate = new RestTemplate();
    }

    @Async
    @Transactional
    public void syncRepository(Long userId, String githubRepoId, String repoName, String fullName, String defaultBranch, String accessToken) {
        // Find repository or create it
        Repository repo = repositoryRepository.findByUserIdAndGithubRepoId(userId, githubRepoId)
                .orElse(Repository.builder()
                        .userId(userId)
                        .githubRepoId(githubRepoId)
                        .build());

        repo.setName(repoName);
        repo.setFullName(fullName);
        repo.setDefaultBranch(defaultBranch);
        repo.setSyncStatus("Syncing");
        repositoryRepository.save(repo);

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + accessToken);
        headers.set("Accept", "application/vnd.github.v3+json");
        headers.set("User-Agent", "BugFlow-App");
        HttpEntity<String> entity = new HttpEntity<>(headers);

        try {
            // 1. Fetch File Tree
            String treeUrl = String.format("https://api.github.com/repos/%s/git/trees/%s", fullName, defaultBranch);
            String url = UriComponentsBuilder.fromHttpUrl(treeUrl)
                    .queryParam("recursive", "1")
                    .toUriString();

            ResponseEntity<Map> treeRes = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            Map<String, Object> treeBody = treeRes.getBody();

            if (treeBody != null && treeBody.containsKey("tree")) {
                List<Map<String, Object>> treeList = (List<Map<String, Object>>) treeBody.get("tree");
                
                // Wipe old indexes
                fileIndexRepository.deleteByRepositoryId(repo.getId());

                List<FileIndex> fileIndexes = new ArrayList<>();
                for (Map<String, Object> item : treeList) {
                    if ("blob".equals(item.get("type"))) {
                        String path = (String) item.get("path");
                        String name = path.contains("/") ? path.substring(path.lastIndexOf("/") + 1) : path;
                        Long size = item.get("size") != null ? ((Number) item.get("size")).longValue() : 0L;
                        String sha = (String) item.get("sha");
                        String extension = path.contains(".") ? path.substring(path.lastIndexOf(".") + 1) : "none";

                        fileIndexes.add(FileIndex.builder()
                                .repositoryId(repo.getId())
                                .path(path)
                                .name(name)
                                .size(size)
                                .sha(sha)
                                .extension(extension)
                                .build());
                    }
                }

                if (!fileIndexes.isEmpty()) {
                    // Batch insert in chunks for performance
                    int CHUNK_SIZE = 1000;
                    for (int i = 0; i < fileIndexes.size(); i += CHUNK_SIZE) {
                        List<FileIndex> chunk = fileIndexes.subList(i, Math.min(i + CHUNK_SIZE, fileIndexes.size()));
                        fileIndexRepository.saveAll(chunk);
                    }
                }
            }

            // 2. Fetch Commit History (Paginated up to 500 commits)
            List<Map<String, Object>> commits = new ArrayList<>();
            int page = 1;
            boolean hasMore = true;

            while (hasMore && commits.size() < 500) {
                String commitsUrl = String.format("https://api.github.com/repos/%s/commits", fullName);
                String urlCom = UriComponentsBuilder.fromHttpUrl(commitsUrl)
                        .queryParam("per_page", 100)
                        .queryParam("page", page)
                        .toUriString();

                ResponseEntity<List> commitRes = restTemplate.exchange(urlCom, HttpMethod.GET, entity, List.class);
                List<Map<String, Object>> pageCommits = commitRes.getBody();

                if (pageCommits == null || pageCommits.isEmpty()) {
                    hasMore = false;
                } else {
                    commits.addAll(pageCommits);
                    page++;
                }
            }

            for (Map<String, Object> c : commits) {
                String hash = (String) c.get("sha");
                Map<String, Object> commitDetail = (Map<String, Object>) c.get("commit");
                String message = "";
                String authorName = "";
                String authorEmail = "";
                String authorDate = "";

                if (commitDetail != null) {
                    message = (String) commitDetail.get("message");
                    
                    Map<String, Object> authorMap = (Map<String, Object>) commitDetail.get("author");
                    if (authorMap != null) {
                        authorName = (String) authorMap.get("name");
                        authorEmail = (String) authorMap.get("email");
                        authorDate = (String) authorMap.get("date");
                    } else {
                        Map<String, Object> committerMap = (Map<String, Object>) commitDetail.get("committer");
                        if (committerMap != null) {
                            authorName = (String) committerMap.get("name");
                            authorEmail = (String) committerMap.get("email");
                            authorDate = (String) committerMap.get("date");
                        }
                    }
                }

                // Upsert commit
                Optional<CommitHistory> existingOpt = commitHistoryRepository.findByRepositoryIdAndHash(repo.getId(), hash);
                CommitHistory commitDoc = existingOpt.orElse(CommitHistory.builder()
                        .repositoryId(repo.getId())
                        .hash(hash)
                        .build());

                commitDoc.setMessage(message);
                commitDoc.setAuthorName(authorName);
                commitDoc.setAuthorEmail(authorEmail);
                commitDoc.setAuthorDate(authorDate);
                commitHistoryRepository.save(commitDoc);
            }

            // Mark ready
            repo.setSyncStatus("Ready");
            repo.setLastSyncedAt(LocalDateTime.now());
            repositoryRepository.save(repo);

        } catch (Exception error) {
            System.err.println("Error syncing repo: " + error.getMessage());
            repo.setSyncStatus("Failed");
            repositoryRepository.save(repo);
        }
    }
}
