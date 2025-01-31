package org.spring.framework.ai.vaadin.service;

import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.QuestionAnswerAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.vectorstore.VectorStore;
import reactor.core.publisher.Flux;

import java.util.List;

import static org.springframework.ai.chat.client.advisor.AbstractChatMemoryAdvisor.CHAT_MEMORY_CONVERSATION_ID_KEY;
import static org.springframework.ai.chat.client.advisor.AbstractChatMemoryAdvisor.CHAT_MEMORY_RETRIEVE_SIZE_KEY;

// A service class that can be called from the browser
// https://vaadin.com/docs/latest/hilla/guides/endpoints
@BrowserCallable
@AnonymousAllowed
public class RagAssistant {

    private final ChatClient chatClient;
    private final ChatMemory chatMemory;
    private final VectorStore vectorStore;
    private final RagContextService ragContextService;

    public RagAssistant(
        ChatMemory chatMemory,
        ChatClient.Builder builder,
        VectorStore vectorStore,
        RagContextService ragContextService) {
        this.ragContextService = ragContextService;
        this.chatMemory = chatMemory;
        this.vectorStore = vectorStore;

        chatClient = builder
            .defaultAdvisors(
                new MessageChatMemoryAdvisor(chatMemory),
                new QuestionAnswerAdvisor(vectorStore)
            )
            .build();
    }

    public Flux<String> stream(String chatId, String systemMessage, String userMessage) {

        return chatClient.prompt()
            .user(userMessage)
            .advisors(a -> a
                .param(CHAT_MEMORY_CONVERSATION_ID_KEY, chatId)
                .param(CHAT_MEMORY_RETRIEVE_SIZE_KEY, 20))
            .stream()
            .content();
    }

    public List<String> getFilesInContext() {
        return ragContextService.getFilesInContext();
    }

    public void clearChatMemory(String chatId) {
        chatMemory.clear(chatId);
    }

}