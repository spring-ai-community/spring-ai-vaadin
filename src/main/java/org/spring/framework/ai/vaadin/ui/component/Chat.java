package org.spring.framework.ai.vaadin.ui.component;

import com.vaadin.flow.component.messages.MessageInput;
import com.vaadin.flow.component.messages.MessageList;
import com.vaadin.flow.component.orderedlayout.Scroller;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.upload.Upload;
import com.vaadin.flow.server.streams.UploadHandler;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import org.spring.framework.ai.vaadin.ui.component.ChatMessage.ChatAttachment;
import org.spring.framework.ai.vaadin.ui.util.ImageUtils;

/**
 * A chat component that provides message list, input field, and file upload functionality. This
 * component is used for interactions between user and AI assistant. Supports text messaging in
 * Markdown and file attachments.
 */
public class Chat extends VerticalLayout {
  private static final int MAX_FILE_COUNT = 10;
  private static final int MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static final String[] ACCEPTED_FILE_TYPES = {"image/*", "text/*", "application/pdf"};

  private final Upload upload;
  private final MessageInput messageInput;
  private final MessageList messageList;

  private final List<ChatAttachment> pendingAttachments = new ArrayList<>();
  private ChatSubmitListener chatSubmitListener;

  public Chat() {
    addClassName("chat");

    // Message list
    messageList = new MessageList();
    messageList.setMarkdown(true);
    messageList.addClassName("message-list");

    // Create upload component
    upload = new Upload(createUploadHandler());
    upload.addFileRemovedListener(
        event -> {
          var fileName = event.getFileName();
          pendingAttachments.removeIf(attachment -> attachment.fileName().equals(fileName));
        });

    upload.addClassName("chat-upload");
    upload.setWidthFull();
    upload.setMaxFiles(MAX_FILE_COUNT);
    upload.setMaxFileSize(MAX_FILE_SIZE);
    upload.setAcceptedFileTypes(ACCEPTED_FILE_TYPES);

    // Create message input
    messageInput = new MessageInput();
    messageInput.addClassName("chat-input");
    messageInput.setWidthFull();

    // Set up message sending
    messageInput.addSubmitListener(event -> sendMessage(event.getValue()));

    // Layout components
    var scroller = new Scroller(messageList);
    scroller.addClassName("chat-scroller");
    scroller.setWidthFull();
    setFlexGrow(1, scroller);
    add(scroller);

    upload.getElement().appendChild(messageInput.getElement());
    setFlexShrink(0, upload);
    add(upload);
  }

  private UploadHandler createUploadHandler() {
    return UploadHandler.inMemory(
        (meta, data) -> {
          var url = "";
          if (meta.contentType().startsWith("image/")) {
            // Create thumbnail before encoding to Base64 data URL
            var thumbnailData = ImageUtils.createThumbnail(data, meta.contentType(), 160, 140);
            var base64 = Base64.getEncoder().encodeToString(thumbnailData);
            url = "data:" + meta.contentType() + ";base64," + base64;
          }
          pendingAttachments.add(
              new ChatAttachment(meta.contentType(), meta.fileName(), data, url));
        });
  }

  /** Clears all messages from the chat. */
  public void clearMessages() {
    messageList.setItems(new ArrayList<>());
  }

  /**
   * Sets the messages to display in the chat.
   *
   * @param messages List of chat messages to display
   */
  public void setMessages(List<ChatMessage> messages) {
    messageList.setItems(messages.stream().map(message -> message.messageListItem).toList());
  }

  /** Sets focus to the message input field. */
  public void focusInput() {
    messageInput.focus();
  }

  /**
   * Sends a new message in the chat. Creates both a user message and an assistant message
   * placeholder.
   *
   * @param message The message content to send
   */
  private void sendMessage(String message) {
    if (!isEnabled() || message.isEmpty()) {
      return;
    }

    var userMessage = new ChatMessage("User", message, pendingAttachments);
    messageList.addItem(userMessage.messageListItem);

    var assistantMessage = new ChatMessage("Assistant", null, null);
    messageList.addItem(assistantMessage.messageListItem);

    chatSubmitListener.onSubmit(userMessage, assistantMessage);

    pendingAttachments.clear();
    upload.clearFileList();
  }

  /**
   * Sets the listener for chat message submissions.
   *
   * @param listener The listener to be notified when a message is submitted
   */
  public void setSubmitListener(ChatSubmitListener listener) {
    this.chatSubmitListener = listener;
  }

  /** Listener interface for chat message submissions. */
  public interface ChatSubmitListener {
    /**
     * Called when a user submits a message.
     *
     * @param userMessage The message sent by the user
     * @param assistantMessage The message placeholder for the assistant's response
     */
    void onSubmit(ChatMessage userMessage, ChatMessage assistantMessage);
  }
}
