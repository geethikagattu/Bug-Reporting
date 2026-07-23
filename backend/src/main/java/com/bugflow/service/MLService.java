package com.bugflow.service;

import com.bugflow.model.Classification;
import com.bugflow.model.Localization;
import com.bugflow.repository.ClassificationRepository;
import com.bugflow.repository.LocalizationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class MLService {

    private final ClassificationRepository classificationRepository;
    private final LocalizationRepository localizationRepository;
    private final RestTemplate restTemplate;

    @Value("${ml.service.url}")
    private String mlServiceUrl;

    public MLService(ClassificationRepository classificationRepository,
                     LocalizationRepository localizationRepository) {
        this.classificationRepository = classificationRepository;
        this.localizationRepository = localizationRepository;
        this.restTemplate = new RestTemplate();
    }

    public ClassifyResponse classifyBug(Long bugId, String title, String description) {
        try {
            String url = mlServiceUrl + "/api/ml/classify";
            Map<String, String> request = new HashMap<>();
            request.put("text", title + " " + description);

            ResponseEntity<Map> responseEntity = restTemplate.postForEntity(url, request, Map.class);
            Map<String, Object> body = responseEntity.getBody();

            if (body != null) {
                Boolean isValid = (Boolean) body.get("isValid");
                String resultClass = (String) body.get("class");
                Double confidence = ((Number) body.get("confidence")).doubleValue();

                Classification classification = Classification.builder()
                        .bugId(bugId)
                        .result(resultClass != null ? resultClass : (isValid ? "Valid Bug" : "Invalid Bug"))
                        .confidenceScore(confidence)
                        .modelUsed("SVM")
                        .build();

                classificationRepository.save(classification);

                return new ClassifyResponse(isValid, confidence, classification.getId());
            }
        } catch (Exception e) {
            System.err.println("Error in ML classifyBug: " + e.getMessage());
        }
        // Fallback if ML service is down or fails
        return new ClassifyResponse(true, 1.0, null);
    }

    public List<String> localizeBug(Long bugId, String description, List<Map<String, String>> projectFiles) {
        List<String> localizedFiles = new ArrayList<>();
        try {
            String url = mlServiceUrl + "/api/ml/localize";
            Map<String, Object> request = new HashMap<>();
            request.put("text", description);
            request.put("files", projectFiles);

            ResponseEntity<Map> responseEntity = restTemplate.postForEntity(url, request, Map.class);
            Map<String, Object> body = responseEntity.getBody();

            if (body != null) {
                List<String> files = (List<String>) body.get("files");
                List<Number> scores = (List<Number>) body.get("scores");

                if (files != null && scores != null) {
                    for (int i = 0; i < files.size(); i++) {
                        Localization localization = Localization.builder()
                                .bugId(bugId)
                                .fileName(files.get(i))
                                .relevanceScore(scores.get(i).doubleValue())
                                .rank(i + 1)
                                .build();
                        localizationRepository.save(localization);
                        localizedFiles.add(files.get(i));
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Error in ML localizeBug: " + e.getMessage());
        }
        return localizedFiles;
    }

    public String assignBug(List<String> topFiles, List<Map<String, String>> commits) {
        try {
            String url = mlServiceUrl + "/api/ml/assign";
            Map<String, Object> request = new HashMap<>();
            request.put("top_files", topFiles);
            request.put("commits", commits);

            ResponseEntity<Map> responseEntity = restTemplate.postForEntity(url, request, Map.class);
            Map<String, Object> body = responseEntity.getBody();

            if (body != null) {
                return (String) body.get("authorEmail");
            }
        } catch (Exception e) {
            System.err.println("Error in ML assignBug: " + e.getMessage());
        }
        return null;
    }

    @lombok.AllArgsConstructor
    @lombok.Getter
    public static class ClassifyResponse {
        private final boolean valid;
        private final double confidence;
        private final Long classificationId;
    }
}
