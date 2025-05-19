package org.spring.framework.ai.vaadin.service;

import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;
import com.vaadin.hilla.exception.EndpointException;
import io.modelcontextprotocol.client.McpSyncClient;
import jakarta.annotation.Nullable;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.SafeGuardAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.messages.MessageType;
import org.springframework.ai.content.Media;
import org.springframework.ai.document.Document;
import org.springframework.ai.mcp.SyncMcpToolCallbackProvider;
import org.springframework.ai.rag.advisor.RetrievalAugmentationAdvisor;
import org.springframework.ai.rag.generation.augmentation.ContextualQueryAugmenter;
import org.springframework.ai.rag.preretrieval.query.transformation.RewriteQueryTransformer;
import org.springframework.ai.rag.retrieval.search.VectorStoreDocumentRetriever;
import org.springframework.ai.reader.tika.TikaDocumentReader;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.util.MimeType;
import reactor.core.publisher.Flux;

import java.util.List;

// A service class that can be called from the browser
// https://vaadin.com/docs/latest/hilla/guides/endpoints
@BrowserCallable
@AnonymousAllowed
public class Assistant {
    public record ChatOptions(
        String systemMessage,
        boolean useMcp
    ) {
    }

    private final ChatOptions defaultOptions = new ChatOptions("", false);

    private final ChatClient chatClient;
    private final ChatMemory chatMemory;
    private final List<McpSyncClient> mcpSyncClients;

    private static final String DEFAULT_SYSTEM = """
        You are an expert on all things Java and Spring related.
        Answer questions in a friendly manner and give clear explanations.
        Always give example code snippets when explaining code.
        """;
    private static final String ATTACHMENT_TEMPLATE = """
        <attachment filename="%s">
                %s
        </attachment>
        """;

    public Assistant(
        ChatMemory chatMemory,
        ChatClient.Builder builder,
        VectorStore vectorStore,
        List<McpSyncClient> mcpSyncClients
    ) {
        this.chatMemory = chatMemory;
        this.mcpSyncClients = mcpSyncClients;

        chatClient = builder
            .defaultAdvisors(

                // Absolutely don't let people ask about PHP 😆
                new SafeGuardAdvisor(List.of("PHP")),

                // Remember the conversation
                MessageChatMemoryAdvisor.builder(chatMemory).build(),

                // Define RAG pipeline
                // See https://docs.spring.io/spring-ai/reference/api/retrieval-augmented-generation.html#modules
                RetrievalAugmentationAdvisor.builder()
                    .queryTransformers(
                        // Rewrite the query for better search results
                        RewriteQueryTransformer.builder()
                            .chatClientBuilder(builder.build().mutate())
                            .build()
                    )
                    // Allow empty context (so you can try the assistant without context and compare)
                    .queryAugmenter(ContextualQueryAugmenter.builder()
                        .allowEmptyContext(true)
                        .build())

                    // Use the vector store to retrieve documents
                    .documentRetriever(
                        VectorStoreDocumentRetriever.builder()
                            .similarityThreshold(0.50)
                            .vectorStore(vectorStore)
                            .build())
                    .build()
            )
            .build();
    }

    public Flux<String> stream(String chatId, String userMessage, List<AttachmentFile> attachments, @Nullable ChatOptions options) {
        if (options == null) {
            options = defaultOptions;
        }

        var system = options.systemMessage().isBlank() ? DEFAULT_SYSTEM : options.systemMessage();

        var processedAttachments = processAttachments(attachments);

        var prompt = chatClient.prompt()
            .system(system)
            .user(u -> {
                u.text(userMessage + processedAttachments.documentContent());
                u.media(processedAttachments.mediaList().toArray(Media[]::new));
            })
            .advisors(a -> {
                a.param(ChatMemory.CONVERSATION_ID, chatId);
            });

        if (options.useMcp) {
            prompt.toolCallbacks(new SyncMcpToolCallbackProvider(mcpSyncClients));
        }

        return prompt.stream().content();
    }

    public List<Message> getHistory(String chatId) {
        return chatMemory.get(chatId).stream()
            .filter(message -> message.getMessageType().equals(MessageType.USER) || message.getMessageType().equals(MessageType.ASSISTANT))
            // TODO: Add attachments
            .map(message -> new Message(message.getMessageType().toString().toLowerCase(), message.getText(), List.of()))
            .toList();
    }

    public void closeChat(String chatId) {
        chatMemory.clear(chatId);
    }

    private record ProcessedAttachments(String documentContent, List<Media> mediaList) {
    }

    private ProcessedAttachments processAttachments(List<AttachmentFile> attachments) {
        // Map text and pdf attachments as documents wrapped in <attachment> tags
        var documentList = attachments.stream()
            .filter(attachment -> attachment.contentType().contains("text") || attachment.contentType().contains("pdf"))
            .toList();

        var documentBuilder = new StringBuilder("\n");
        documentList.forEach(attachment -> {
            var data = new ByteArrayResource(attachment.data());
            var documents = new TikaDocumentReader(data).read();
            var content = String.join("\n", documents.stream().map(Document::getText).toList());
            documentBuilder.append(String.format(ATTACHMENT_TEMPLATE, attachment.fileName(), content));
        });

        // Map image attachments to Media objects
        var mediaList = attachments.stream()
            .filter(attachment -> attachment.contentType().contains("image"))
            .map(attachment -> new Media(MimeType.valueOf(attachment.contentType()),
                new ByteArrayResource(attachment.data())))
            .toList();

        return new ProcessedAttachments(documentBuilder.toString(), mediaList);
    }

    public static record Attachment(String type, String key, String fileName, String url) {}

    public static record Message(String role, String content, @Nullable List<Attachment> attachments) {}
}
