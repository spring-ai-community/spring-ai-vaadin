package org.spring.framework.ai.vaadin.ui.component;

import com.vaadin.flow.component.messages.MessageListItem;
import java.util.List;


public class ChatMessage {
  private List<ChatAttachment> attachments;
  MessageListItem messageListItem = new MessageListItem();
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

  /**
   * Gets the role of the message sender.
   *
   * @return The role (e.g., "User" or "Assistant")
   */
  public String getRole() {
    return messageListItem.getUserName();
  }

  /**
   * Gets the text content of the message.
   *
   * @return The message content
   */
  public String getText() {
    return messageListItem.getText();
  }

  /**
   * Appends text to the message content.
   *
   * @param text The text to append
   */
  public void appendText(String text) {
    if (messageListItem.getText().equals(TYPING_INDICATOR)) {
      messageListItem.setText("");
    }
    messageListItem.appendText(text);
  }

  /**
   * Gets the attachments associated with this message.
   *
   * @return The list of attachments, or null if none
   */
  public List<ChatAttachment> getAttachments() {
    return attachments;
  }

  public static record ChatAttachment(String type, String fileName, byte[] data, String url) {}
}
