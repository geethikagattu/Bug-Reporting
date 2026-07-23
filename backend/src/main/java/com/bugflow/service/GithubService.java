package com.bugflow.service;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.*;

@Service
public class GithubService {

    private final RestTemplate restTemplate;

    public GithubService() {
        this.restTemplate = new RestTemplate();
    }

    public List<Map<String, Object>> fetchUserRepos(String accessToken) {
        List<Map<String, Object>> repos = new ArrayList<>();
        int page = 1;
        boolean hasMore = true;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + accessToken);
        headers.set("Accept", "application/vnd.github.v3+json");
        headers.set("User-Agent", "BugFlow-App"); // GitHub requires User-Agent header
        HttpEntity<String> entity = new HttpEntity<>(headers);

        while (hasMore) {
            String url = UriComponentsBuilder.fromHttpUrl("https://api.github.com/user/repos")
                    .queryParam("per_page", 100)
                    .queryParam("page", page)
                    .queryParam("sort", "updated")
                    .toUriString();

            try {
                ResponseEntity<List> responseEntity = restTemplate.exchange(url, HttpMethod.GET, entity, List.class);
                List<Map<String, Object>> pageRepos = responseEntity.getBody();

                if (pageRepos == null || pageRepos.isEmpty()) {
                    hasMore = false;
                } else {
                    for (Map<String, Object> repo : pageRepos) {
                        Map<String, Object> filteredRepo = new HashMap<>();
                        filteredRepo.put("id", repo.get("id"));
                        filteredRepo.put("name", repo.get("name"));
                        filteredRepo.put("fullName", repo.get("full_name"));
                        filteredRepo.put("description", repo.get("description"));
                        filteredRepo.put("url", repo.get("html_url"));
                        filteredRepo.put("defaultBranch", repo.get("default_branch"));
                        filteredRepo.put("updatedAt", repo.get("updated_at"));
                        filteredRepo.put("language", repo.get("language"));
                        filteredRepo.put("private", repo.get("private"));
                        repos.add(filteredRepo);
                    }
                    page++;
                }
            } catch (Exception e) {
                System.err.println("Error fetching user repos page " + page + ": " + e.getMessage());
                hasMore = false;
            }
        }
        return repos;
    }
}
