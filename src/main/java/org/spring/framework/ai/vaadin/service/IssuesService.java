package org.spring.framework.ai.vaadin.service;

import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;

import java.util.ArrayList;
import java.util.List;

@BrowserCallable
@AnonymousAllowed
public class IssuesService {

    public record Issue(
        Long id,
        String title,
        String description,
        IssueStatus status,
        String assignee
    ) {}

    public enum IssueStatus {
        OPEN,
        IN_PROGRESS,
        RESOLVED,
        CLOSED
    }


    private List<Issue> issues = new ArrayList<>();
    private Long nextId = 1L;

    public IssuesService() {
        issues.add(new Issue(
            nextId++,
            "CSS is playing hide and seek",
            "The navigation menu looks perfect in Chrome but plays hide and seek in Firefox. Definitely not a browser compatibility issue (narrator: it was).",
            IssueStatus.OPEN,
            "Alice"
        ));

        issues.add(new Issue(
            nextId++,
            "The Monday Morning Bug",
            "System works perfectly fine Tuesday through Sunday, but mysteriously breaks every Monday at 9 AM. Correlation with coffee intake levels under investigation.",
            IssueStatus.IN_PROGRESS,
            "Bob"
        ));

        issues.add(new Issue(
            nextId++,
            "Legacy Code Archaeology",
            "Found ancient code from 2021 with comment 'TODO: temporary fix'. Carbon dating suggests it's now a permanent feature.",
            IssueStatus.OPEN,
            "Charlie"
        ));

        issues.add(new Issue(
            nextId++,
            "Documentation Time Machine",
            "Documentation claims feature X exists. Developer claims feature X doesn't exist. Schrödinger's feature?",
            IssueStatus.RESOLVED,
            "Alice"
        ));

        issues.add(new Issue(
            nextId++,
            "It works on my machine™",
            "Production deployment failing. Works flawlessly on local. DevOps suggests developer's lucky coffee mug might be the crucial difference.",
            IssueStatus.IN_PROGRESS,
            "David"
        ));
    }

    public List<Issue> findAll() {
        return new ArrayList<>(issues);
    }

    public List<Issue> findByAssignee(String assignee) {
        return issues.stream()
            .filter(issue -> issue.assignee().equalsIgnoreCase(assignee))
            .toList();
    }

    public Issue update(Issue updatedIssue) {
        for (int i = 0; i < issues.size(); i++) {
            if (issues.get(i).id().equals(updatedIssue.id())) {
                issues.set(i, updatedIssue);
                return updatedIssue;
            }
        }
        throw new IllegalArgumentException("Issue not found with id: " + updatedIssue.id());
    }

    public void delete(Long id) {
        issues.removeIf(issue -> issue.id().equals(id));
    }
}
