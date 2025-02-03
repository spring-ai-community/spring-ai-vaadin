package org.spring.framework.ai.vaadin;

import org.springframework.ai.mcp.client.McpClient;
import org.springframework.ai.mcp.client.McpSyncClient;
import org.springframework.ai.mcp.client.transport.ServerParameters;
import org.springframework.ai.mcp.client.transport.StdioClientTransport;
import org.springframework.ai.mcp.spring.McpFunctionCallback;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.nio.file.Paths;
import java.time.Duration;
import java.util.List;

@Configuration
public class McpConfig {

    @Bean
    public List<McpFunctionCallback> functionCallbacks(McpSyncClient mcpClient) {

        var callbacks = mcpClient.listTools(null)
            .tools()
            .stream()
            .map(tool -> new McpFunctionCallback(mcpClient, tool))
            .toList();
        return callbacks;
    }

    @Bean(destroyMethod = "close")
    public McpSyncClient mcpClient() {

        // based on
        // https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem
        var stdioParams = ServerParameters.builder("npx")
            .args("-y", "@modelcontextprotocol/server-filesystem", getFsPath())
            .build();

        var mcpClient = McpClient.sync(new StdioClientTransport(stdioParams))
            .requestTimeout(Duration.ofSeconds(10)).build();

        var init = mcpClient.initialize();

        System.out.println("MCP Initialized: " + init);

        return mcpClient;

    }

    private static String getFsPath() {
        return Paths.get(System.getProperty("user.dir"), "src").toString();
    }
}
