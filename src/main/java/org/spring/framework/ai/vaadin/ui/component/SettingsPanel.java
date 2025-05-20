package org.spring.framework.ai.vaadin.ui.component;

import com.vaadin.flow.component.ClickEvent;
import com.vaadin.flow.component.ComponentEventListener;
import com.vaadin.flow.component.button.Button;
import com.vaadin.flow.component.checkbox.Checkbox;
import com.vaadin.flow.component.dependency.CssImport;
import com.vaadin.flow.component.html.H3;
import com.vaadin.flow.component.html.H4;
import com.vaadin.flow.component.html.ListItem;
import com.vaadin.flow.component.html.Span;
import com.vaadin.flow.component.html.UnorderedList;
import com.vaadin.flow.component.icon.Icon;
import com.vaadin.flow.component.icon.VaadinIcon;
import com.vaadin.flow.component.orderedlayout.HorizontalLayout;
import com.vaadin.flow.component.orderedlayout.VerticalLayout;
import com.vaadin.flow.component.textfield.TextArea;
import com.vaadin.flow.component.upload.Upload;
import com.vaadin.flow.server.streams.UploadHandler;
import com.vaadin.flow.shared.Registration;
import org.spring.framework.ai.vaadin.service.RagContextService;
import org.spring.framework.ai.vaadin.ui.util.CustomMultipartFile;

@CssImport("./styles/settings-panel.css")
public class SettingsPanel extends VerticalLayout {

  private final RagContextService ragContextService;
  private final TextArea systemMessageField;
  private final Checkbox useMcpField;
  private final UnorderedList filesList;
  private final Button closeButton;
  private Upload upload;

  public SettingsPanel(RagContextService ragContextService) {
    this.ragContextService = ragContextService;

    addClassName("settings-panel");
    setPadding(true);
    setSpacing(true);

    // Create header
    var header = new HorizontalLayout();
    header.addClassName("settings-header");
    header.setWidthFull();

    var title = new H3("Settings");

    closeButton = new Button(new Icon(VaadinIcon.CLOSE));
    closeButton.addThemeNames("icon", "small", "contrast", "tertiary");
    closeButton.setAriaLabel("Close settings");
    closeButton.setTooltipText("Close settings");

    header.add(title, closeButton);
    header.setFlexGrow(1, title);

    // Create general settings section
    var generalSettingsHeading = new H4("General settings");
    generalSettingsHeading.addClassName("settings-sub-heading");

    systemMessageField = new TextArea("System Message");
    systemMessageField.setWidthFull();
    systemMessageField.setMinHeight("100px");

    useMcpField = new Checkbox("Use MCP");

    // Create RAG data sources section
    var ragHeading = new H4("RAG data sources");
    ragHeading.addClassName("settings-sub-heading");

    // Files list
    filesList = new UnorderedList();

    // File upload
    upload =
        new Upload(
            UploadHandler.inMemory(
                (meta, data) -> {
                  try {
                    // Upload file to RAG context
                    ragContextService.addFileToContext(
                        new CustomMultipartFile(meta.fileName(), meta.contentType(), data));

                    // Update the files list
                    updateFilesList();
                  } catch (Exception e) {
                    e.printStackTrace();
                  }
                }));
    upload.setMaxFiles(10);
    upload.setMaxFileSize(10 * 1024 * 1024);
    upload.setAcceptedFileTypes(".txt", ".pdf", ".md", ".doc", ".docx");

    // Add everything to the layout
    add(
        header,
        generalSettingsHeading,
        systemMessageField,
        useMcpField,
        ragHeading,
        filesList,
        upload);

    addAttachListener(
        event -> {
          // Update the files list when the component is attached
          updateFilesList();
        });
  }

  public Registration addCloseListener(ComponentEventListener<ClickEvent<Button>> listener) {
    return closeButton.addClickListener(listener);
  }

  public void updateFilesList() {
    getUI()
        .ifPresent(
            ui ->
                ui.access(
                    () -> {
                      var files = ragContextService.getFilesInContext();

                      filesList.removeAll();
                      upload.clearFileList();

                      if (files == null || files.isEmpty()) {
                        return;
                      }

                      for (var file : files) {
                        var item = new ListItem(new Span(file));
                        filesList.add(item);
                      }
                    }));
  }

  public String getSystemMessage() {
    return systemMessageField.getValue();
  }

  public void setSystemMessage(String message) {
    systemMessageField.setValue(message != null ? message : "");
  }

  public boolean isUseMcp() {
    return useMcpField.getValue();
  }

  public void setUseMcp(boolean useMcp) {
    useMcpField.setValue(useMcp);
  }
}
