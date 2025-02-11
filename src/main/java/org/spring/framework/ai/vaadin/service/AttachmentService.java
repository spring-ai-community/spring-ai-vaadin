package org.spring.framework.ai.vaadin.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AttachmentService {

    private final Map<String, List<Attachment>> attachments = new HashMap<>();

    public void addAttachment(String chatId, Attachment attachment) {
        attachments.computeIfAbsent(chatId, k -> new ArrayList<>()).add(attachment);
    }

    public List<Attachment> getAttachments(String chatId) {
        return attachments.getOrDefault(chatId, List.of());
    }

    public void clearAttachments(String chatId) {
        attachments.remove(chatId);
    }
}
