package com.bugflow.service;

import com.bugflow.model.*;
import com.bugflow.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BugServiceTest {

    @Mock private BugRepository bugRepository;
    @Mock private BugHistoryRepository bugHistoryRepository;
    @Mock private ProjectRepository projectRepository;
    @Mock private UserRepository userRepository;
    @Mock private ClassificationRepository classificationRepository;
    @Mock private LocalizationRepository localizationRepository;
    @Mock private AssignmentRepository assignmentRepository;
    @Mock private BugPipelineService bugPipelineService;

    private BugService bugService;

    @BeforeEach
    public void setup() {
        bugService = new BugService(
                bugRepository, bugHistoryRepository, projectRepository, userRepository,
                classificationRepository, localizationRepository, assignmentRepository, bugPipelineService
        );
    }

    @Test
    public void testCreateBug_Success() {
        Long projectId = 1L;
        Long reporterId = 2L;

        Project project = Project.builder().id(projectId).name("Test Project").build();
        User reporter = User.builder().id(reporterId).name("Reporter").email("rep@test.com").build();

        when(projectRepository.findById(projectId)).thenReturn(Optional.of(project));
        when(userRepository.findById(reporterId)).thenReturn(Optional.of(reporter));
        when(bugRepository.save(any(Bug.class))).thenAnswer(invocation -> {
            Bug bug = invocation.getArgument(0);
            bug.setId(10L);
            return bug;
        });

        Bug created = bugService.createBug("Bug title", "Bug description", "High", projectId, reporterId);

        assertNotNull(created);
        assertEquals(10L, created.getId());
        assertEquals("Bug title", created.getTitle());
        assertEquals("Open", created.getStatus());
        verify(bugHistoryRepository, times(1)).save(any(BugHistory.class));
        verify(bugPipelineService, times(1)).processBugPipeline(eq(10L), eq("Bug description"), eq(projectId));
    }

    @Test
    public void testUpdateBugStatus_Success() {
        Long bugId = 10L;
        Long userId = 2L;

        User assignee = User.builder().id(userId).name("Developer").role("Developer").build();
        Bug bug = Bug.builder()
                .id(bugId)
                .title("Test Bug")
                .status("Open")
                .assignedTo(assignee)
                .build();

        when(bugRepository.findById(bugId)).thenReturn(Optional.of(bug));
        when(userRepository.findById(userId)).thenReturn(Optional.of(assignee));

        Bug updated = bugService.updateBugStatus(bugId, "Resolved", userId, "Developer");

        assertNotNull(updated);
        assertEquals("Resolved", updated.getStatus());
        verify(bugRepository, times(1)).save(bug);
        verify(bugHistoryRepository, times(1)).save(any(BugHistory.class));
    }
}
