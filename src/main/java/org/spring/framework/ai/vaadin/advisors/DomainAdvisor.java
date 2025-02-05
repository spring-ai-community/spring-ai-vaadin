package org.spring.framework.ai.vaadin.advisors;

import java.util.List;

import jakarta.annotation.Nonnull;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.api.AdvisedRequest;
import org.springframework.ai.chat.client.advisor.api.AdvisedResponse;
import org.springframework.ai.chat.client.advisor.api.CallAroundAdvisor;
import org.springframework.ai.chat.client.advisor.api.CallAroundAdvisorChain;
import org.springframework.ai.chat.client.advisor.api.StreamAroundAdvisor;
import org.springframework.ai.chat.client.advisor.api.StreamAroundAdvisorChain;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.core.Ordered;

import reactor.core.publisher.Flux;


public class DomainAdvisor implements CallAroundAdvisor, StreamAroundAdvisor {

    private final String domainDescription;
    private final ChatClient evaluationClient;

    public DomainAdvisor(String domainDescription, ChatClient evaluationClient) {
        this.domainDescription = domainDescription;
        this.evaluationClient = evaluationClient;
    }

    @Override
    @Nonnull
    public String getName() {
        return this.getClass().getSimpleName();
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    @Override
    @Nonnull
    public AdvisedResponse aroundCall(AdvisedRequest advisedRequest, CallAroundAdvisorChain chain) {
        if (isOutsideDomain(advisedRequest.userText(), advisedRequest)) {
            return createOffTopicResponse(advisedRequest);
        }

        return chain.nextAroundCall(enhanceWithDomainContext(advisedRequest));
    }

    @Override
    @Nonnull
    public Flux<AdvisedResponse> aroundStream(AdvisedRequest advisedRequest,
                                              StreamAroundAdvisorChain chain) {
        if (isOutsideDomain(advisedRequest.userText(), advisedRequest)) {
            return Flux.just(createOffTopicResponse(advisedRequest));
        }

        return chain.nextAroundStream(enhanceWithDomainContext(advisedRequest));
    }

    private boolean isOutsideDomain(String userQuery, AdvisedRequest advisedRequest) {
        // Get chat history from the context if available
        List<AssistantMessage> assistantMessages = advisedRequest.messages().stream()
            .filter(msg -> msg instanceof AssistantMessage)
            .map(msg -> (AssistantMessage) msg)
            .toList();

        List<UserMessage> userMessages = advisedRequest.messages().stream()
            .filter(msg -> msg instanceof UserMessage)
            .map(msg -> (UserMessage) msg)
            .toList();

        // Build context-aware evaluation prompt
        String evaluationPrompt;
        if (!assistantMessages.isEmpty() || !userMessages.isEmpty()) {
            evaluationPrompt = String.format("""
                    As an assistant focused on: %s
                    
                    Given this conversation context:
                    %s
                    
                    Is the following message relevant within the conversation or to my focus area?
                    Consider both direct domain relevance and contextual relevance (like follow-up questions).
                    Reply with just Yes or No.
                    
                    Message: %s
                    """,
                domainDescription,
                formatChatHistory(userMessages, assistantMessages),
                userQuery);
        } else {
            // No history - evaluate direct domain relevance
            evaluationPrompt = String.format("""
                    As an assistant focused on: %s
                    
                    Is this question relevant to my focus area? Reply with just Yes or No.
                    Question: %s
                    """,
                domainDescription, userQuery);
        }

        String response = evaluationClient.prompt()
            .user(evaluationPrompt)
            .call()
            .content();

        return !response.toLowerCase().contains("yes");
    }

    private String formatChatHistory(List<UserMessage> userMessages, List<AssistantMessage> assistantMessages) {
        StringBuilder history = new StringBuilder();
        int maxHistoryMessages = 5; // Limit history to last few messages for context

        int startIdx = Math.max(0, userMessages.size() - maxHistoryMessages);
        for (int i = startIdx; i < userMessages.size(); i++) {
            history.append("User: ").append(userMessages.get(i).getText()).append("\n");
            if (i < assistantMessages.size()) {
                history.append("Assistant: ").append(assistantMessages.get(i).getText()).append("\n");
            }
        }
        return history.toString();
    }

    private AdvisedRequest enhanceWithDomainContext(AdvisedRequest original) {
        String context = String.format("""
                You are an assistant focused on: %s
                Provide helpful responses within this domain.""",
            domainDescription);

        return AdvisedRequest.from(original)
            .systemText((original.systemText() != null ? original.systemText() + "\n" : "") + context)
            .build();
    }

    private AdvisedResponse createOffTopicResponse(AdvisedRequest request) {
        var failureResponse = String.format(
            "I am focused on helping with %s. This question appears to be outside that scope. " +
                "Could you please ask something related to this topic?",
            domainDescription
        );
        return new AdvisedResponse(
            ChatResponse.builder()
                .generations(List.of(new Generation(new AssistantMessage(failureResponse))))
                .build(),
            request.adviseContext()
        );
    }
}

