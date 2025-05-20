package org.spring.framework.ai.vaadin.ui.view;

import com.vaadin.flow.component.dependency.CssImport;
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
import org.spring.framework.ai.vaadin.ui.component.Chat.ChatAttachment;
import org.spring.framework.ai.vaadin.ui.component.Chat.ChatMessage;
import org.spring.framework.ai.vaadin.ui.component.ChatHeader;
import org.spring.framework.ai.vaadin.ui.component.SettingsPanel;
import org.springframework.beans.factory.annotation.Autowired;

@Route("")
@PageTitle("Spring AI Assistant")
@CssImport("./styles/main-view.css")
public class MainView extends MasterDetailLayout {

  private final Chat chat;
  private final SettingsPanel settingsPanel;
  private final Assistant assistant;
  private String chatId;
  private ChatOptions options = new ChatOptions("", false);

  public MainView(@Autowired Assistant assistant, @Autowired RagContextService ragContextService) {
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
    chat.setSubmitListener(
        (ChatMessage userMessage, ChatMessage assistantMessage) -> {
          chat.setEnabled(false);
          options = new ChatOptions(settingsPanel.getSystemMessage(), settingsPanel.isUseMcp());
          var attachmentFiles =
              userMessage.getAttachments().stream()
                  .map(this::chatAttahcmentToAttachmentFile)
                  .toList();
          assistant.stream(chatId, userMessage.getContent(), attachmentFiles, options)
              .subscribe(
                  (String token) -> {
                    getUI().get().access(() -> assistantMessage.appendText(token));
                  },
                  (error) -> {
                    getUI().get().access(() -> chat.setEnabled(true));
                  },
                  () -> {
                    getUI().get().access(() -> chat.setEnabled(true));
                  });
        });

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

  private void loadChatHistory() {
    var history = assistant.getHistory(chatId);
    chat.setMessages(history.stream().map(m -> messageToChatMessage(m)).toList());
  }

  private ChatMessage messageToChatMessage(Message message) {
    return new ChatMessage(
        message.role(),
        message.content(),
        message.attachments().stream()
            .map(a -> new ChatAttachment(a.type(), a.fileName(), null, a.url()))
            .toList());
  }

  private AttachmentFile chatAttahcmentToAttachmentFile(ChatAttachment chatAttachment) {
    return new AttachmentFile(
        chatAttachment.fileName(), chatAttachment.type(), chatAttachment.data());
  }

  private void resetChat() {
    // Close the current chat
    assistant.closeChat(chatId);

    // Generate a new chat ID
    chatId = UUID.randomUUID().toString();

    // Clear message list
    chat.clearMessages();
  }

  private void toggleSettings() {
    setDetail(getDetail() == null ? settingsPanel : null);
  }
}
