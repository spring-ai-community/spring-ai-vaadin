package org.spring.framework.ai.vaadin.service;

import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.model.Media;

import reactor.core.publisher.Flux;

import static org.springframework.ai.chat.client.advisor.AbstractChatMemoryAdvisor.CHAT_MEMORY_CONVERSATION_ID_KEY;
import static org.springframework.ai.chat.client.advisor.AbstractChatMemoryAdvisor.CHAT_MEMORY_RETRIEVE_SIZE_KEY;

import java.util.List;

// A service class that can be called from the browser
// https://vaadin.com/docs/latest/hilla/guides/endpoints
@BrowserCallable
@AnonymousAllowed
public class BasicAssistant {

    private final List<Media> chatAttachments;
    private final ChatClient chatClient;
    private final ChatMemory chatMemory;
    private static final String DEFAULT_SYSTEM = """
        You are an expert on all things Java and Spring related.
        Answer questions in a friendly manner and give clear explanations.
        Always give example code snippets when explaining code.
        """;

    public BasicAssistant(ChatMemory chatMemory, ChatClient.Builder builder, List<Media> chatAttachments) {
        this.chatMemory = chatMemory;
        this.chatAttachments = chatAttachments;

        chatClient = builder
            .defaultAdvisors(new MessageChatMemoryAdvisor(chatMemory))
            .build();
    }

    public Flux<String> stream(String chatId, String systemMessage, String userMessage, List<String> attachmentNames) {
        var system = systemMessage.isBlank() ? DEFAULT_SYSTEM : systemMessage;

        var mediaArray = chatAttachments.stream()
            .filter(media -> attachmentNames.contains(media.getName()))
            .sorted((a, b) -> Integer.compare(
                attachmentNames.indexOf(a.getName()), 
                attachmentNames.indexOf(b.getName()))
            )
            .toArray(Media[]::new);
        
        chatAttachments.clear();

        return chatClient.prompt()
            .system(system)
            .user(u -> u.text(userMessage).media(mediaArray))
            .advisors(a -> a
                .param(CHAT_MEMORY_CONVERSATION_ID_KEY, chatId)
                .param(CHAT_MEMORY_RETRIEVE_SIZE_KEY, 20))
            .stream()
            .content();
    }

}