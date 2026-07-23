package com.bugflow.service;

import com.bugflow.model.*;
import com.bugflow.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class BugService {

    private final BugRepository bugRepository;
    private final BugHistoryRepository bugHistoryRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ClassificationRepository classificationRepository;
    private final LocalizationRepository localizationRepository;
    private final AssignmentRepository assignmentRepository;
    private final BugPipelineService bugPipelineService;

    public BugService(BugRepository bugRepository,
                      BugHistoryRepository bugHistoryRepository,
                      ProjectRepository projectRepository,
                      UserRepository userRepository,
                      ClassificationRepository classificationRepository,
                      LocalizationRepository localizationRepository,
                      AssignmentRepository assignmentRepository,
                      BugPipelineService bugPipelineService) {
        this.bugRepository = bugRepository;
        this.bugHistoryRepository = bugHistoryRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.classificationRepository = classificationRepository;
        this.localizationRepository = localizationRepository;
        this.assignmentRepository = assignmentRepository;
        this.bugPipelineService = bugPipelineService;
    }

    @Transactional
    public Bug createBug(String title, String description, String priority, Long projectId, Long reporterId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));
        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new IllegalArgumentException("Reporter not found"));

        Bug bug = Bug.builder()
                .title(title)
                .description(description)
                .priority(priority != null ? priority : "Medium")
                .status("Open")
                .project(project)
                .reporter(reporter)
                .build();

        bugRepository.save(bug);

        // Create log history
        bugHistoryRepository.save(BugHistory.builder()
                .bug(bug)
                .status("Open")
                .updatedBy(reporter)
                .comment("Bug submitted by tester")
                .build());

        // Trigger ML pipeline asynchronously
        bugPipelineService.processBugPipeline(bug.getId(), description, projectId);

        return bug;
    }

    public List<Bug> getBugsWithFilter(String status, String priority, Long projectId) {
        return bugRepository.findBugsWithFilter(status, priority, projectId);
    }

    public List<Bug> getMyBugs(Long reporterId) {
        return bugRepository.findByReporterId(reporterId);
    }

    public List<Bug> getAssignedBugs(Long developerId) {
        return bugRepository.findByAssignedToId(developerId);
    }

    public Map<String, Object> getBugDetails(Long id) {
        Bug bug = bugRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Bug not found"));

        Classification classification = classificationRepository.findByBugId(bug.getId()).orElse(null);
        List<Localization> localizations = localizationRepository.findByBugIdOrderByRankAsc(bug.getId());
        List<BugHistory> history = bugHistoryRepository.findByBugIdOrderByUpdatedAtAsc(bug.getId());
        Assignment assignment = assignmentRepository.findByBugId(bug.getId()).orElse(null);

        Map<String, Object> response = new HashMap<>();
        response.put("id", bug.getId());
        response.put("title", bug.getTitle());
        response.put("description", bug.getDescription());
        response.put("priority", bug.getPriority());
        response.put("status", bug.getStatus());
        response.put("createdAt", bug.getCreatedAt());
        response.put("updatedAt", bug.getUpdatedAt());
        
        // Match frontend's format for populating reporter/project/assignedTo
        response.put("reporter", Map.of("id", bug.getReporter().getId(), "name", bug.getReporter().getName(), "email", bug.getReporter().getEmail()));
        response.put("project", Map.of("id", bug.getProject().getId(), "name", bug.getProject().getName()));
        if (bug.getAssignedTo() != null) {
            response.put("assignedTo", Map.of("id", bug.getAssignedTo().getId(), "name", bug.getAssignedTo().getName(), "email", bug.getAssignedTo().getEmail()));
        } else {
            response.put("assignedTo", null);
        }

        response.put("mlClassification", bug.getMlIsValid() != null ? Map.of("isValid", bug.getMlIsValid(), "confidence", bug.getMlConfidence()) : null);
        response.put("localizedFiles", bug.getLocalizedFiles());
        
        response.put("classificationResult", classification);
        response.put("localizationFiles", localizations);
        response.put("historyLog", history);
        response.put("assignmentInfo", assignment);

        return response;
    }

    public Bug updateBug(Long id, String title, String description, String priority, Long userId, String userRole) {
        Bug bug = bugRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Bug not found"));

        if (!"Admin".equals(userRole) && !bug.getReporter().getId().equals(userId)) {
            throw new IllegalStateException("Not authorized to update this bug");
        }

        if (title != null) bug.setTitle(title);
        if (description != null) bug.setDescription(description);
        if (priority != null) bug.setPriority(priority);

        return bugRepository.save(bug);
    }

    @Transactional
    public Bug updateBugStatus(Long id, String status, Long userId, String userRole) {
        Bug bug = bugRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Bug not found"));

        boolean isAdmin = "Admin".equals(userRole);
        boolean isAssignee = bug.getAssignedTo() != null && bug.getAssignedTo().getId().equals(userId);

        if (!isAdmin && !isAssignee) {
            throw new IllegalStateException("Not authorized to update this bug status");
        }

        bug.setStatus(status);
        bugRepository.save(bug);

        User updater = userRepository.findById(userId).orElse(null);
        bugHistoryRepository.save(BugHistory.builder()
                .bug(bug)
                .status(status)
                .updatedBy(updater)
                .comment("Status updated manually")
                .build());

        return bug;
    }

    public void deleteBug(Long id) {
        Bug bug = bugRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Bug not found"));
        bugRepository.delete(bug);
    }
}
