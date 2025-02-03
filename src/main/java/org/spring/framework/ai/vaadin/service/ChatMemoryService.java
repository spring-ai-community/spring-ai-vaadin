package org.spring.framework.ai.vaadin.service;

import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;
import org.springframework.ai.chat.memory.ChatMemory;

@BrowserCallable
@AnonymousAllowed
public class ChatMemoryService {

    private final ChatMemory chatMemory;

    public ChatMemoryService(ChatMemory chatMemory) {
        this.chatMemory = chatMemory;

    }

    public void clearChatMemory(String chatId) {
        chatMemory.clear(chatId);
    }
}
