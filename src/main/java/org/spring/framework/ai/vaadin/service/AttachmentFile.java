package org.spring.framework.ai.vaadin.service;

public record AttachmentFile(String id, String fileName, String contentType, byte[] data) {
}
