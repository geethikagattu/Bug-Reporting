package com.bugflow.service;

import com.bugflow.model.*;
import com.bugflow.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminService {

    private final BugRepository bugRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final AssignmentRepository assignmentRepository;
    private final BugHistoryRepository bugHistoryRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminService(BugRepository bugRepository,
                        UserRepository userRepository,
                        ProjectRepository projectRepository,
                        AssignmentRepository assignmentRepository,
                        BugHistoryRepository bugHistoryRepository,
                        PasswordEncoder passwordEncoder) {
        this.bugRepository = bugRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.assignmentRepository = assignmentRepository;
        this.bugHistoryRepository = bugHistoryRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Map<String, Object> getDashboardStats() {
        long totalBugs = bugRepository.count();
        long openBugs = bugRepository.countByStatus("Open");
        long resolvedBugs = bugRepository.countByStatus("Resolved");
        long totalUsers = userRepository.count();
        long activeProjects = projectRepository.count();

        long resolutionRate = totalBugs == 0 ? 0 : Math.round(((double) resolvedBugs / totalBugs) * 100);

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalBugs", totalBugs);
        stats.put("openBugs", openBugs);
        stats.put("resolvedBugs", resolvedBugs);
        stats.put("totalUsers", totalUsers);
        stats.put("activeProjects", activeProjects);
        stats.put("resolutionRate", resolutionRate);

        return stats;
    }

    public List<User> getAllUsers() {
        // Clear passwords before returning (or do it in DTO/Controller)
        List<User> users = userRepository.findAll();
        users.forEach(u -> u.setPassword(null));
        return users;
    }

    public User createUser(String name, String email, String password, String role) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Email already exists");
        }
        User user = User.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(role)
                .build();
        return userRepository.save(user);
    }

    public User updateUser(Long id, User details) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setName(details.getName());
        user.setEmail(details.getEmail());
        if (details.getRole() != null) {
            user.setRole(details.getRole());
        }
        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        userRepository.delete(user);
    }

    public List<Assignment> getAllAssignments() {
        return assignmentRepository.findAll();
    }

    @Transactional
    public void overrideAssignment(Long assignmentId, Long newDeveloperId, Long adminId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assignment log not found"));

        User newDeveloper = userRepository.findById(newDeveloperId)
                .orElseThrow(() -> new IllegalArgumentException("Developer not found"));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("Admin not found"));

        // Update assignment entry
        assignment.setDeveloper(newDeveloper);
        assignment.setAssignedBy("Admin");
        assignmentRepository.save(assignment);

        // Update Bug
        Bug bug = bugRepository.findById(assignment.getBugId())
                .orElseThrow(() -> new IllegalArgumentException("Bug not found"));
        bug.setAssignedTo(newDeveloper);
        bug.setStatus("In Progress");
        bugRepository.save(bug);

        // Save History
        bugHistoryRepository.save(BugHistory.builder()
                .bug(bug)
                .status("In Progress")
                .updatedBy(admin)
                .comment("Assignment overridden by Admin")
                .build());
    }
}
