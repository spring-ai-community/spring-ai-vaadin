package org.spring.framework.ai.vaadin.service;

import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.mcp.spring.McpFunctionCallback;
import reactor.core.publisher.Flux;

import java.util.List;

import static org.springframework.ai.chat.client.advisor.AbstractChatMemoryAdvisor.CHAT_MEMORY_CONVERSATION_ID_KEY;
import static org.springframework.ai.chat.client.advisor.AbstractChatMemoryAdvisor.CHAT_MEMORY_RETRIEVE_SIZE_KEY;

@BrowserCallable
@AnonymousAllowed
public class McpAssistant {

    private final ChatClient chatClient;

    public McpAssistant(
        ChatClient.Builder builder,
        List<McpFunctionCallback> functionCallbacks,
        ChatMemory chatMemory
    ) {
        chatClient = builder
            .defaultSystem("""
                You are a helpful coding assistant. You have access to a Spring Boot based project with a Vaadin Hilla frontend through functions.
                Use the functions to help the user with coding problems and questions.
                ALWAYS ask for permission before making changes to the project.
                """)
            .defaultAdvisors(new MessageChatMemoryAdvisor(chatMemory))
            .defaultFunctions(functionCallbacks.toArray(new McpFunctionCallback[0]))
            .build();
    }


    public String call(String chatId, String userMessage) {
        return chatClient
            .prompt()
            .user(userMessage).advisors(a -> a
                .param(CHAT_MEMORY_CONVERSATION_ID_KEY, chatId)
                .param(CHAT_MEMORY_RETRIEVE_SIZE_KEY, 20)
            )
            .call()
            .content();
    }
}
