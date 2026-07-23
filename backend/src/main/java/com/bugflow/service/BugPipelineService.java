package com.bugflow.service;

import com.bugflow.model.*;
import com.bugflow.repository.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class BugPipelineService {

    private final BugRepository bugRepository;
    private final BugHistoryRepository bugHistoryRepository;
    private final RepositoryRepository repositoryRepository;
    private final FileIndexRepository fileIndexRepository;
    private final CommitHistoryRepository commitHistoryRepository;
    private final UserRepository userRepository;
    private final AssignmentRepository assignmentRepository;
    private final MLService mlService;

    public BugPipelineService(BugRepository bugRepository,
                              BugHistoryRepository bugHistoryRepository,
                              RepositoryRepository repositoryRepository,
                              FileIndexRepository fileIndexRepository,
                              CommitHistoryRepository commitHistoryRepository,
                              UserRepository userRepository,
                              AssignmentRepository assignmentRepository,
                              MLService mlService) {
        this.bugRepository = bugRepository;
        this.bugHistoryRepository = bugHistoryRepository;
        this.repositoryRepository = repositoryRepository;
        this.fileIndexRepository = fileIndexRepository;
        this.commitHistoryRepository = commitHistoryRepository;
        this.userRepository = userRepository;
        this.assignmentRepository = assignmentRepository;
        this.mlService = mlService;
    }

    @Async
    @Transactional
    public void processBugPipeline(Long bugId, String description, Long projectId) {
        try {
            // Retrieve bug
            Optional<Bug> bugOpt = bugRepository.findById(bugId);
            if (bugOpt.isEmpty()) return;
            Bug bug = bugOpt.get();

            // 1. Classify
            MLService.ClassifyResponse classifyRes = mlService.classifyBug(bugId, bug.getTitle(), description);
            
            bug.setMlIsValid(classifyRes.isValid());
            bug.setMlConfidence(classifyRes.getConfidence());
            bugRepository.save(bug);

            if (!classifyRes.isValid()) {
                bug.setStatus("Closed");
                bugRepository.save(bug);

                bugHistoryRepository.save(BugHistory.builder()
                        .bug(bug)
                        .status("Closed")
                        .comment("Auto-closed by ML: Invalid Bug")
                        .build());
                return; // Stop pipeline
            }

            // 2. Localize
            // Find project owner to query repo
            User owner = bug.getProject().getOwner();
            List<Map<String, String>> projectFiles = new ArrayList<>();

            if (owner != null) {
                List<Repository> repos = repositoryRepository.findByUserId(owner.getId());
                if (!repos.isEmpty()) {
                    Repository repo = repos.get(0); // primary repository
                    List<FileIndex> files = fileIndexRepository.findByRepositoryIdWithLimit(repo.getId(), 100);
                    for (FileIndex f : files) {
                        Map<String, String> fileMap = new HashMap<>();
                        fileMap.put("path", f.getPath());
                        fileMap.put("name", f.getName());
                        projectFiles.add(fileMap);
                    }
                }
            }

            // Fallback mock files if repository has no files indexed yet
            if (projectFiles.isEmpty()) {
                Map<String, String> file1 = new HashMap<>();
                file1.put("path", "src/main.js");
                file1.put("name", "main.js");
                Map<String, String> file2 = new HashMap<>();
                file2.put("path", "src/auth/login.js");
                file2.put("name", "login.js");
                projectFiles.add(file1);
                projectFiles.add(file2);
            }

            List<String> localizedFiles = mlService.localizeBug(bugId, description, projectFiles);
            bug.setLocalizedFiles(localizedFiles);
            bugRepository.save(bug);

            // 3. Assign
            if (!localizedFiles.isEmpty()) {
                // Fetch commits touching these files
                List<Map<String, String>> commitList = new ArrayList<>();
                if (owner != null) {
                    List<Repository> repos = repositoryRepository.findByUserId(owner.getId());
                    if (!repos.isEmpty()) {
                        Repository repo = repos.get(0);
                        List<CommitHistory> commits = commitHistoryRepository.findByRepositoryId(repo.getId());
                        for (CommitHistory c : commits) {
                            Map<String, String> comMap = new HashMap<>();
                            comMap.put("hash", c.getHash());
                            comMap.put("authorEmail", c.getAuthorEmail());
                            comMap.put("message", c.getMessage());
                            commitList.add(comMap);
                        }
                    }
                }

                // Fallback mock commit
                if (commitList.isEmpty()) {
                    Map<String, String> mockCommit = new HashMap<>();
                    mockCommit.put("hash", "123");
                    mockCommit.put("authorEmail", "dev@test.com");
                    mockCommit.put("message", "fixed src/main.js");
                    commitList.add(mockCommit);
                }

                String developerEmail = mlService.assignBug(localizedFiles, commitList);
                if (developerEmail != null) {
                    Optional<User> devOpt = userRepository.findByEmailAndRole(developerEmail, "Developer");
                    if (devOpt.isPresent()) {
                        User dev = devOpt.get();

                        // Save Assignment
                        assignmentRepository.save(Assignment.builder()
                                .bugId(bugId)
                                .developer(dev)
                                .assignedBy("System")
                                .build());

                        // Update Bug
                        bug.setAssignedTo(dev);
                        bug.setStatus("In Progress");
                        bugRepository.save(bug);

                        // Update history
                        bugHistoryRepository.save(BugHistory.builder()
                                .bug(bug)
                                .status("In Progress")
                                .comment("Auto-assigned to " + dev.getName() + " by ML System based on expertise.")
                                .build());
                    }
                }
            }

        } catch (Exception e) {
            System.err.println("Error in async bug pipeline: " + e.getMessage());
        }
    }
}
