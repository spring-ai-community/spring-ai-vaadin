import { useCallback, useEffect, useState } from 'react';
import { Chat } from '@vaadin/flow-frontend/chat/Chat.js';
import { Button, Checkbox, Icon, TextArea, Tooltip, Upload, UploadElement } from '@vaadin/react-components';
import { nanoid } from 'nanoid';
import '@vaadin/icons';
import '@vaadin/vaadin-lumo-styles/icons';
import './index.css';
import { Assistant, RagContextService } from 'Frontend/generated/endpoints';
import Mermaid from 'Frontend/components/Mermaid.js';
import ChatOptions from 'Frontend/generated/org/spring/framework/ai/vaadin/service/Assistant/ChatOptions';
import { useForm } from '@vaadin/hilla-react-form';
import ChatOptionsModel from 'Frontend/generated/org/spring/framework/ai/vaadin/service/Assistant/ChatOptionsModel';

const defaultOptions: ChatOptions = {
  systemMessage: '',
  useMcp: false,
};

export default function SpringAiAssistant() {
  const [chatId, setChatId] = useState(nanoid());
  const [filesInContext, setFilesInContext] = useState<string[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  async function resetChat() {
    setChatId(nanoid());
  }

  // Set up form for managing chat options
  const { field, model, read, value } = useForm(ChatOptionsModel);

  useEffect(() => {
    read(defaultOptions);
  }, []);

  // Handle RAG context
  useEffect(() => {
    getContextFiles();
  }, []);

  function getContextFiles() {
    return RagContextService.getFilesInContext().then(setFilesInContext);
  }

  const toggleSettingsOpen = () => {
    setSettingsOpen(!settingsOpen);
  };

  // Define a custom renderer for Mermaid charts
  const renderer = useCallback((language = '', content = '') => {
    if (language.includes('mermaid')) {
      return <Mermaid chart={content} />;
    }
    return null;
  }, []);

  return (
    <div className="main-layout">
      <div className={`chat-layout ${settingsOpen ? 'settings-open' : ''}`}>
        <header className="chat-header">
          <h1 className="chat-heading">
            <span>🌱</span>
            <span>Spring AI Assistant</span>
          </h1>

          <Button onClick={resetChat} theme="icon small contrast tertiary">
            <Icon icon="lumo:plus" />
            <Tooltip slot="tooltip" text="New chat" />
          </Button>

          <Button onClick={toggleSettingsOpen} theme="icon small contrast tertiary">
            <Icon icon="lumo:cog" />
            <Tooltip slot="tooltip" text="Settings" />
          </Button>
        </header>

        <Chat
          chatId={chatId}
          service={Assistant}
          acceptedFiles="image/*,text/*,application/pdf"
          options={value}
          renderer={renderer}
        />
      </div>

      {settingsOpen && (
        <div className="settings-panel">
          <div className="settings-header">
            <h3>Settings</h3>
            <Button onClick={toggleSettingsOpen} theme="icon small contrast tertiary">
              <Icon icon="lumo:cross" />
              <Tooltip slot="tooltip" text="Close settings" />
            </Button>
          </div>

          <h4 className="settings-sub-heading">General settings</h4>
          <TextArea label="System Message" {...field(model.systemMessage)} minRows={3} />

          <Checkbox label="Use MCP" {...field(model.useMcp)} />

          <h4 className="settings-sub-heading">RAG data sources</h4>

          {filesInContext.length > 0 && (
            <ul>
              {filesInContext.map((file) => (
                <li key={file}>{file}</li>
              ))}
            </ul>
          )}

          <Upload
            maxFiles={10}
            maxFileSize={10 * 1024 * 1024}
            accept=".txt,.pdf,.md,.doc,.docx"
            onUploadRequest={async (e) => {
              e.preventDefault();

              await RagContextService.addFileToContext(e.detail.file);

              getContextFiles();
              // Clear the file input
              (e.target as UploadElement).files = [];
            }}
          />
        </div>
      )}
    </div>
  );
}
