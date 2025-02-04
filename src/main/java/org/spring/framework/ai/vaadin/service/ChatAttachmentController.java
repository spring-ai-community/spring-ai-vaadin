package org.spring.framework.ai.vaadin.service;

import java.io.IOException;
import java.util.List;

import org.springframework.ai.model.Media;
import org.springframework.http.ResponseEntity;
import org.springframework.util.MimeType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/attachment")
public class ChatAttachmentController {

    private final List<Media> chatAttachments;

    public ChatAttachmentController(List<Media> chatAttachments) {
        this.chatAttachments = chatAttachments;
    }

    @PostMapping
    public ResponseEntity<String> handleFileUpload(@RequestParam("file") MultipartFile file) throws IOException {
        var media = Media.builder().data(file.getResource()).mimeType(MimeType.valueOf(file.getContentType())).build();
        chatAttachments.add(media);

        return ResponseEntity.ok("{\"name\": \"" + media.getName() + "\" }");
    }
}
