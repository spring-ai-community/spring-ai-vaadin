package org.spring.framework.ai.vaadin.views;

import static org.springframework.ai.chat.client.advisor.AbstractChatMemoryAdvisor.CHAT_MEMORY_CONVERSATION_ID_KEY;
import static org.springframework.ai.chat.client.advisor.AbstractChatMemoryAdvisor.CHAT_MEMORY_RETRIEVE_SIZE_KEY;

import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.button.ButtonVariant;
import com.vaadin.flow.component.html.Div;
import com.vaadin.flow.component.html.H1;
import com.vaadin.flow.component.html.Header;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.router.Route;
import com.vaadin.flow.theme.lumo.LumoIcon;
import java.util.List;
import java.util.UUID;

import org.spring.framework.ai.vaadin.service.AttachmentService;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.RetrievalAugmentationAdvisor;
import org.springframework.ai.chat.client.advisor.SafeGuardAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.messages.MessageType;
import org.springframework.ai.document.Document;
import org.springframework.ai.mcp.spring.McpFunctionCallback;
import org.springframework.ai.model.Media;
import org.springframework.ai.rag.generation.augmentation.ContextualQueryAugmenter;
import org.springframework.ai.rag.preretrieval.query.transformation.RewriteQueryTransformer;
import org.springframework.ai.rag.retrieval.search.VectorStoreDocumentRetriever;
import org.springframework.ai.reader.tika.TikaDocumentReader;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.util.MimeType;
import org.vaadin.components.experimental.chat.Chat;
import org.vaadin.components.experimental.chat.FlowAiChatService;
import reactor.core.publisher.Flux;

@Route("flow")
public class FlowView extends Div implements FlowAiChatService {

  private final ChatClient chatClient;
  private final ChatMemory chatMemory;
  private static final String DEFAULT_SYSTEM =
      """
        You are an expert on all things Java and Spring related.
        Answer questions in a friendly manner and give clear explanations.
        Always give example code snippets when explaining code.
        Use mermaid diagrams to illustrate concepts when appropriate.
        """;
  private static final String ATTACHMENT_TEMPLATE =
      """
        <attachment filename="%s">
                %s
        </attachment>
        """;

  public FlowView(
      ChatMemory chatMemory,
      ChatClient.Builder builder,
      AttachmentService attachmentService,
      VectorStore vectorStore,
      List<McpFunctionCallback> mcpFunctionCallbacks) {
    this.chatMemory = chatMemory;

    chatClient =
        builder
            .defaultAdvisors(

                // Absolutely don't let people ask about PHP 😆
                new SafeGuardAdvisor(List.of("PHP")),

                // Remember the conversation
                new MessageChatMemoryAdvisor(chatMemory),

                // Define RAG pipeline
                // See
                // https://docs.spring.io/spring-ai/reference/api/retrieval-augmented-generation.html#modules
                RetrievalAugmentationAdvisor.builder()
                    .queryTransformers(
                        // Rewrite the query for better search results
                        RewriteQueryTransformer.builder()
                            .chatClientBuilder(builder.build().mutate())
                            .build())
                    // Allow empty context (so you can try the assistant without context and
                    // compare)
                    .queryAugmenter(
                        ContextualQueryAugmenter.builder().allowEmptyContext(true).build())

                    // Use the vector store to retrieve documents
                    .documentRetriever(
                        VectorStoreDocumentRetriever.builder()
                            .similarityThreshold(0.50)
                            .vectorStore(vectorStore)
                            .build())
                    .build())
            .build();

    setSizeFull();

    setClassName("main-layout");

    var chatLayout = new Div();
    chatLayout.setClassName("chat-layout");

    var chatHeader = new Header();
    chatHeader.setClassName("chat-header");
    var chatHeading = new H1(new Span("🌱"), new Span("Spring Assistant"));
    chatHeading.setClassName("chat-heading");
    chatHeader.add(chatHeading);

    var chat = new Chat(this, UUID.randomUUID().toString(), "image/*,text/*,application/pdf");


    var newChatButton = new Button(LumoIcon.PLUS.create());
    newChatButton.addThemeVariants(
        ButtonVariant.LUMO_ICON,
        ButtonVariant.LUMO_SMALL,
        ButtonVariant.LUMO_CONTRAST,
        ButtonVariant.LUMO_TERTIARY);
        newChatButton.addClickListener(e -> {
          chat.setChatId(UUID.randomUUID().toString());
        });
    chatHeader.add(newChatButton);

   
    chatLayout.add(chatHeader, chat);
    add(chatLayout);
  }

  @Override
  public void closeChat(String chatId) {
    // TODO Auto-generated method stub
    throw new UnsupportedOperationException("Unimplemented method 'closeChat'");
  }

  @Override
  public List<Message> getHistory(String chatId) {
    return chatMemory.get(chatId, 100).stream()
            .filter(message -> message.getMessageType().equals(MessageType.USER) || message.getMessageType().equals(MessageType.ASSISTANT))
            // TODO: Add attachments
            .map(message -> new Message(message.getMessageType().toString().toLowerCase(), message.getText(), List.of()))
            .toList();
  }

  @Override
  public Flux<String> stream(String chatId, String userMessage, List<AttachmentFile> attachments) {
    var system = DEFAULT_SYSTEM;

    var processedAttachments = processAttachments(attachments);

    var prompt =
        chatClient
            .prompt()
            .system(system)
            .user(
                u -> {
                  u.text(userMessage + processedAttachments.documentContent());
                  u.media(processedAttachments.mediaList().toArray(Media[]::new));
                })
            .advisors(
                a -> {
                  a.param(CHAT_MEMORY_CONVERSATION_ID_KEY, chatId);
                  a.param(CHAT_MEMORY_RETRIEVE_SIZE_KEY, 20);
                });

    return prompt.stream().content();
  }

  private record ProcessedAttachments(String documentContent, List<Media> mediaList) {}

  private ProcessedAttachments processAttachments(List<AttachmentFile> attachments) {
    // Map text and pdf attachments as documents wrapped in <attachment> tags
    var documentList =
        attachments.stream()
            .filter(
                attachment ->
                    attachment.contentType().contains("text")
                        || attachment.contentType().contains("pdf"))
            .toList();

    var documentBuilder = new StringBuilder("\n");
    documentList.forEach(
        attachment -> {
            var data = new ByteArrayResource(attachment.data());
            var documents = new TikaDocumentReader(data).read();
            var content = String.join("\n", documents.stream().map(Document::getText).toList());
            documentBuilder.append(
                String.format(ATTACHMENT_TEMPLATE, attachment.fileName(), content));
        });

    // Map image attachments to Media objects
    var mediaList =
        attachments.stream()
            .filter(attachment -> attachment.contentType().contains("image"))
            .map(
                attachment -> {
                    return new Media(
                        MimeType.valueOf(attachment.contentType()),
                        new ByteArrayResource(attachment.data()));
                })
            .toList();

    return new ProcessedAttachments(documentBuilder.toString(), mediaList);
  }
}
