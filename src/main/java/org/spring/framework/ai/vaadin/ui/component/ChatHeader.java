package org.spring.framework.ai.vaadin.ui.component;

import com.vaadin.flow.component.ClickEvent;
import com.vaadin.flow.component.ComponentEventListener;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.html.H1;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.icon.Icon;
import com.vaadin.flow.component.icon.VaadinIcon;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.shared.Registration;

public class ChatHeader extends HorizontalLayout {
  private final Button newChatButton;
  private final Button settingsButton;

  public ChatHeader() {
    addClassName("chat-header");
    setWidthFull();

    // Create heading
    var heading = new H1(new Span("🌱"), new Span("Spring AI Assistant"));
    heading.addClassName("chat-heading");

    // Create buttons
    newChatButton = new Button(new Icon(VaadinIcon.PLUS));
    newChatButton.addThemeNames("icon", "small", "contrast", "tertiary");
    newChatButton.setAriaLabel("New chat");
    newChatButton.setTooltipText("New chat");

    settingsButton = new Button(new Icon(VaadinIcon.COG));
    settingsButton.addThemeNames("icon", "small", "contrast", "tertiary");
    settingsButton.setAriaLabel("Settings");
    settingsButton.setTooltipText("Settings");

    // Add components to layout
    addToStart(heading);
    addToEnd(newChatButton, settingsButton);
  }

  public Registration addNewChatListener(ComponentEventListener<ClickEvent<Button>> listener) {
    return newChatButton.addClickListener(listener);
  }

  public Registration addToggleSettingsListener(
      ComponentEventListener<ClickEvent<Button>> listener) {
    return settingsButton.addClickListener(listener);
  }
}
