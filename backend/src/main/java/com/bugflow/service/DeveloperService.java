package com.bugflow.service;

import com.bugflow.model.Bug;
import com.bugflow.repository.BugRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DeveloperService {

    private final BugRepository bugRepository;

    public DeveloperService(BugRepository bugRepository) {
        this.bugRepository = bugRepository;
    }

    public Map<String, Object> getDeveloperDashboardStats(Long developerId) {
        List<Bug> assignedBugs = bugRepository.findByAssignedToId(developerId);

        long totalAssigned = assignedBugs.size();
        long inProgress = assignedBugs.stream().filter(b -> "In Progress".equals(b.getStatus())).count();
        long resolved = assignedBugs.stream().filter(b -> "Resolved".equals(b.getStatus())).count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalAssigned", totalAssigned);
        stats.put("inProgress", inProgress);
        stats.put("resolved", resolved);

        return stats;
    }

    public List<Bug> getBugsAssignedTo(Long developerId) {
        return bugRepository.findByAssignedToId(developerId);
    }

    public List<Bug> getResolvedBugsHistory(Long developerId) {
        return bugRepository.findByAssignedToIdAndStatus(developerId, "Resolved");
    }
}
