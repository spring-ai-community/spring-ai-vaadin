package org.spring.framework.ai.vaadin.ui.view;

import com.vaadin.flow.component.masterdetaillayout.MasterDetailLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.router.PageTitle;
import com.vaadin.flow.router.Route;
import java.util.UUID;
import org.spring.framework.ai.vaadin.service.Assistant;
import org.spring.framework.ai.vaadin.service.Assistant.ChatOptions;
import org.spring.framework.ai.vaadin.service.Assistant.Message;
import org.spring.framework.ai.vaadin.service.AttachmentFile;
import org.spring.framework.ai.vaadin.service.RagContextService;
import org.spring.framework.ai.vaadin.ui.component.Chat;
import org.spring.framework.ai.vaadin.ui.component.ChatHeader;
import org.spring.framework.ai.vaadin.ui.component.ChatMessage;
import org.spring.framework.ai.vaadin.ui.component.ChatMessage.ChatAttachment;
import org.spring.framework.ai.vaadin.ui.component.SettingsPanel;

/**
 * Main view for the Spring AI Assistant application. Provides a chat interface with settings panel
 * in a master-detail layout.
 */
@Route("")
@PageTitle("Spring AI Assistant")
public class MainView extends MasterDetailLayout {

  private final Chat chat;
  private final SettingsPanel settingsPanel;
  private final Assistant assistant;
  private String chatId;

  public MainView(Assistant assistant, RagContextService ragContextService) {
    this.assistant = assistant;
    this.chatId = UUID.randomUUID().toString();

    addClassNames("main-layout");
    setSizeFull();

    // Create chat header
    var chatHeader = new ChatHeader();
    chatHeader.addNewChatListener(e -> resetChat());
    chatHeader.addToggleSettingsListener(e -> toggleSettings());

    // Create settings panel
    this.settingsPanel = new SettingsPanel(ragContextService);
    settingsPanel.updateFilesList();
    settingsPanel.addClassName("settings-panel");
    settingsPanel.setHeightFull();
    // Add close listener to settings panel
    settingsPanel.addCloseListener(e -> toggleSettings());

    // Create chat component
    this.chat = new Chat();
    chat.addClassName("chat-component");
    chat.setSizeFull();
    chat.setSubmitListener(this::handleSubmit);

    // Create chat layout
    var chatContent = new VerticalLayout(chatHeader, chat);
    chatContent.setPadding(false);
    chatContent.setSpacing(false);
    chatContent.setSizeFull();

    setMaster(chatContent);
    setAnimationEnabled(false);
    setDetailMinSize("400px");
    setDetailSize("600px");

    loadChatHistory();
  }

  /** Handles the submit event from the chat component. */
  private void handleSubmit(ChatMessage userMessage, ChatMessage assistantMessage) {
    chat.addClassName("streaming");

    var options = new ChatOptions(settingsPanel.getSystemMessage(), settingsPanel.isUseMcp());
    var attachmentFiles =
        userMessage.getAttachments().stream().map(this::chatAttachmentToAttachmentFile).toList();

    var ui = getUI().get();
    assistant.stream(chatId, userMessage.getText(), attachmentFiles, options)
        .subscribe(
            // Append to the assistantMessage as it streams
            token -> ui.access(() -> {
              chat.addClassName("streaming");
              assistantMessage.appendText(token);
            }),
            error -> ui.access(() -> assistantMessage.appendText("Error: " + error.getMessage())),
            () -> ui.access(() -> chat.removeClassName("streaming")));
  }

  /** Loads the chat history for the current chat ID. */
  private void loadChatHistory() {
    var history = assistant.getHistory(chatId);
    chat.setMessages(history.stream().map(this::messageToChatMessage).toList());
  }

  /**
   * Converts an Assistant Message to a ChatMessage for UI display.
   *
   * @param message The Assistant message to convert
   * @return The corresponding ChatMessage for UI
   */
  private ChatMessage messageToChatMessage(Message message) {
    return new ChatMessage(
        message.role(),
        message.content(),
        message.attachments().stream()
            .map(a -> new ChatAttachment(a.type(), a.fileName(), null, a.url()))
            .toList());
  }

  /**
   * Converts a ChatAttachment to an AttachmentFile.
   *
   * @param chatAttachment The chat attachment to convert
   * @return The corresponding AttachmentFile
   */
  private AttachmentFile chatAttachmentToAttachmentFile(ChatAttachment chatAttachment) {
    return new AttachmentFile(
        chatAttachment.fileName(), chatAttachment.type(), chatAttachment.data());
  }

  /** Resets the chat by closing the current session and creating a new one. */
  private void resetChat() {
    assistant.closeChat(chatId);
    chatId = UUID.randomUUID().toString();
    chat.clearMessages();
  }

  /** Toggles the visibility of the settings panel. */
  private void toggleSettings() {
    setDetail(getDetail() == null ? settingsPanel : null);
  }
}
