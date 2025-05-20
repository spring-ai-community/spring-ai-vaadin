package org.spring.framework.ai.vaadin.ui.component;

import com.vaadin.flow.component.messages.MessageInput;
import com.vaadin.flow.component.messages.MessageList;
import com.vaadin.flow.component.messages.MessageListItem;
import com.vaadin.flow.component.orderedlayout.Scroller;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.upload.Upload;
import com.vaadin.flow.server.streams.UploadHandler;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import org.spring.framework.ai.vaadin.ui.util.ImageUtils;

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
    upload =
        new Upload(
            UploadHandler.inMemory(
                (meta, data) -> {
                  var isImage = meta.contentType().startsWith("image/");
                  if (isImage) {
                    // Create thumbnail before encoding to Base64
                    var thumbnailData =
                        ImageUtils.createThumbnail(data, meta.contentType(), 160, 140);
                    var base64 = Base64.getEncoder().encodeToString(thumbnailData);
                    var dataUrl = "data:" + meta.contentType() + ";base64," + base64;
                    pendingAttachments.add(
                        new ChatAttachment(meta.contentType(), meta.fileName(), data, dataUrl));
                  } else {
                    pendingAttachments.add(
                        new ChatAttachment(meta.contentType(), meta.fileName(), data, ""));
                  }
                }));

    upload.addFileRemovedListener(
        event -> {
          var fileName = event.getFileName();
          pendingAttachments.removeIf(attachment -> attachment.fileName.equals(fileName));
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
    setFlexGrow(1, scroller);
    add(scroller);

    upload.getElement().appendChild(messageInput.getElement());
    setFlexShrink(0, upload);
    add(upload);
  }

  public void clearMessages() {
    messageList.setItems(new ArrayList<>());
  }

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

  public void setSubmitListener(ChatSubmitListener listener) {
    this.chatSubmitListener = listener;
  }

  public static record ChatAttachment(String type, String fileName, byte[] data, String url) {}

  public static class ChatMessage {
    private List<ChatAttachment> attachments;
    private MessageListItem messageListItem = new MessageListItem();
    private final String TYPING_INDICATOR = "<div class='typing-indicator'></div>";

    public ChatMessage(String role, String content, List<ChatAttachment> attachments) {
      var contentBuilder = new StringBuilder();

      if (attachments != null) {
        // Format message attachments attachments as thumbnails in HTML
        var attachmentsBuilder = new StringBuilder("<div class='attachments'>");

        for (var attachment : attachments) {
          var isImage = attachment.type.startsWith("image/");
          attachmentsBuilder.append("<div class='attachment' title='" + attachment.fileName + "'>");
          if (isImage) {
            attachmentsBuilder.append(
                "<img src='"
                    + attachment.url
                    + "' alt='"
                    + attachment.fileName
                    + "' class='attachment-image' />");
          } else {
            attachmentsBuilder.append("<div class='attachment-icon'>📄</div>");
          }
          ;
          attachmentsBuilder.append(
              "<span class='attachment-name'>" + attachment.fileName + "</span>");
          attachmentsBuilder.append("</div>");
        }

        attachmentsBuilder.append("</div>");
        contentBuilder.append(attachmentsBuilder);
      }
      if (content != null) {
        // Append the message text content
        contentBuilder.append(content);
      }

      if (contentBuilder.isEmpty()) {
        // If no content, show typing indicator
        contentBuilder.append(TYPING_INDICATOR);
      }

      messageListItem.setText(contentBuilder.toString());
      messageListItem.setUserName(role);
      this.attachments = attachments;
    }

    public String getRole() {
      return messageListItem.getUserName();
    }

    public String getContent() {
      return messageListItem.getText();
    }

    public void appendText(String text) {
      if (messageListItem.getText().equals(TYPING_INDICATOR)) {
        messageListItem.setText("");
      }
      messageListItem.appendText(text);
    }

    public List<ChatAttachment> getAttachments() {
      return attachments;
    }
  }

  /**
   * Sets the messages to display in the chat.
   *
   * @param list List of chat messages to display
   */
  public void setMessages(List<ChatMessage> list) {
    messageList.setItems(list.stream().map(m -> m.messageListItem).toList());
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
