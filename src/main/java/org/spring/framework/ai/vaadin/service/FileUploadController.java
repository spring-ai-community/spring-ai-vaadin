package org.spring.framework.ai.vaadin.service;

import java.io.IOException;

import org.springframework.ai.reader.tika.TikaDocumentReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/upload")
public class FileUploadController {


    private final RagContextService ragContextService;

    public FileUploadController(RagContextService ragContextService) {
        this.ragContextService = ragContextService;
    }

    @PostMapping
    public ResponseEntity<String> handleFileUpload(@RequestParam("file") MultipartFile file) throws IOException {
        ragContextService.addFileToContext(file);
        return ResponseEntity.ok("File uploaded successfully: " + file.getOriginalFilename());
    }
}
