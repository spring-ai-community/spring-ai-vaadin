package org.spring.framework.ai.vaadin.service;

import jakarta.annotation.Nullable;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Flux;

import java.util.List;

public interface AiChatService {

    record Options(
        String systemMessage,
        List<String> attachmentIds
    ){ }

    record Attachment(
        String type,
        String key,
        String fileName,
        String url
    ) {}

    record Message(
        String role,
        String content,
        @Nullable List<Attachment> attachments
    ) {}

    Flux<String> stream(String chatId, String userMessage, @Nullable Options options);

    String uploadAttachment(String chatId, MultipartFile file);

    List<Message> getHistory(String chatId);

    void closeChat(String chatId);
}
