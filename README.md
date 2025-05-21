# Spring AI Vaadin

An example application that provides a Vaadin user interface for Spring AI, enabling interactive AI-powered chat experiences for Java and Spring developers.

## Overview

This starter project demonstrates how to build AI-powered chat interfaces in a Spring Boot application by combining Spring AI with Vaadin's rich UI components.

> **Note:** A React-based frontend (using Vaadin [Hilla](https://vaadin.com/docs/latest/hilla/faq)) is available on the `hilla` branch. When switching between branches, delete the `src/main/frontend/generated` directory to avoid startup issues.

## Features

- **AI-powered Chat Interface**: Interact with the AI assistant through a chat UI with support for file uploads as attachments
- **RAG Support**: Upload and analyze documents to provide context for your AI queries
- **Model Context Protocol (MCP)**: Optional MCP integration for enhanced capabilities

## Prerequisites

- Java 21 or higher
- OpenAI API key

## Getting Started

### 1. Configure your API key

Add your OpenAI API key to your environment variables:

```bash
export OPENAI_API_KEY=your-api-key
```

### 2. Build and run the application

```bash
./mvnw spring-boot:run
```

The application will be available at http://localhost:8080.

## Using RAG (Retrieval Augmented Generation)

1. Open the settings panel by clicking the gear icon
2. Upload relevant documents (PDF, DOCX, TXT, etc.)
3. Ask questions related to the uploaded content

The AI will then use the document content to provide more accurate and contextual responses.

## Technologies

- **Spring Boot**: Application framework
- **Spring AI**: AI capabilities integration
- **Vaadin**: UI framework
- **Model Context Protocol (MCP)**: For enhanced capabilities

## License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details.
