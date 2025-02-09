package org.spring.framework.ai.vaadin.service;

import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.model.Media;
import org.springframework.ai.reader.tika.TikaDocumentReader;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.util.MimeType;
import org.springframework.web.multipart.MultipartFile;

import reactor.core.publisher.Flux;

import static org.springframework.ai.chat.client.advisor.AbstractChatMemoryAdvisor.CHAT_MEMORY_CONVERSATION_ID_KEY;
import static org.springframework.ai.chat.client.advisor.AbstractChatMemoryAdvisor.CHAT_MEMORY_RETRIEVE_SIZE_KEY;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

// A service class that can be called from the browser
// https://vaadin.com/docs/latest/hilla/guides/endpoints
@BrowserCallable
@AnonymousAllowed
public class BasicAssistant {

    private final List<Attachment> chatAttachments;
    private final ChatClient chatClient;
    private final ChatMemory chatMemory;
    private static final String DEFAULT_SYSTEM = """
        You are an expert on all things Java and Spring related.
        Answer questions in a friendly manner and give clear explanations.
        Always give example code snippets when explaining code.
        Use mermaid diagrams to illustrate concepts when appropriate.
        """;
    private static final String ATTACHMENT_TEMPLATE= """
        <attachment filename="%s">
                %s
        </attachment>
        """;

    public BasicAssistant(ChatMemory chatMemory, ChatClient.Builder builder, List<Attachment> chatAttachments) {
        this.chatMemory = chatMemory;
        this.chatAttachments = chatAttachments;

        chatClient = builder
            .defaultAdvisors(new MessageChatMemoryAdvisor(chatMemory))
            .build();
    }

    public Flux<String> stream(String chatId, String systemMessage, String userMessage, List<String> attachmentIds) {
        var system = systemMessage.isBlank() ? DEFAULT_SYSTEM : systemMessage;

        // Retrieve attachments from the list of attachment IDs
        var attachments = attachmentIds.stream()
            .flatMap(id -> chatAttachments.stream().filter(attachment -> attachment.id().equals(id))).toList();
        chatAttachments.clear();
        
        // Map text and pdf attachments as documents wrapped in <attachment> tags
        var documentList = attachments.stream().filter(attachment -> attachment.contentType().contains("text") || attachment.contentType().contains("pdf")).toList();

        var documentBuilder = new StringBuilder("\n");
        documentList.forEach(attachment -> {
            var data = new ByteArrayResource(attachment.data());
            var documents = new TikaDocumentReader(data).read();
            var content = String.join("\n", documents.stream().map(document -> document.getText()).toList());            
            documentBuilder.append(String.format(ATTACHMENT_TEMPLATE, attachment.fileName(), content));
        });
        
        // Map image attachments to Media objects
        var mediaList = attachments.stream().filter(attachment -> attachment.contentType().contains("image"))
            .map(attachment -> new Media(MimeType.valueOf(attachment.contentType()), new ByteArrayResource(attachment.data()))).toList();

        return chatClient.prompt()
            .system(system)
            .user(u -> u.text(userMessage + documentBuilder).media(mediaList.toArray(Media[]::new)))
            .advisors(a -> a
                .param(CHAT_MEMORY_CONVERSATION_ID_KEY, chatId)
                .param(CHAT_MEMORY_RETRIEVE_SIZE_KEY, 20))
            .stream()
            .content();
    }

    public String uploadAttachment(MultipartFile file) throws IOException {
        var attachment = new Attachment(UUID.randomUUID().toString(), file.getOriginalFilename(), file.getContentType(), file.getBytes());
        chatAttachments.add(attachment);
        return attachment.id();
    }

}