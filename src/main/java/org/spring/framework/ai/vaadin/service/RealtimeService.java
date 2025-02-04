package org.spring.framework.ai.vaadin.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import com.vaadin.flow.server.auth.AnonymousAllowed;
import com.vaadin.hilla.BrowserCallable;

@BrowserCallable
@AnonymousAllowed
public class RealtimeService {
    private static final String OPENAI_API_URL = "https://api.openai.com/v1/realtime/sessions";
    private static final String OPENAI_API_KEY = System.getenv("OPENAI_API_KEY");

    public String createEphemeralToken() {
        try {
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(OPENAI_API_URL))
                .header("Authorization", "Bearer " + OPENAI_API_KEY)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString("""
                    {
                        "model": "gpt-4o-realtime-preview-2024-12-17",
                        "voice": "verse"
                    }
                """))
                .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            return response.body();
        } catch (Exception e) {
            throw new RuntimeException("Failed to create ephemeral token", e);
        }
    }
}