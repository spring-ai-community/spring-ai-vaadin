package org.spring.framework.ai.vaadin.model;

public record Issue(
    Long id,
    String title,
    String description,
    IssueStatus status,
    String assignee
) {
}
