import { useCallback, useEffect, useState } from 'react';
import { Chat } from 'Frontend/components/Chat';
import { Button, Icon, Tooltip, TextArea, Upload, UploadElement } from '@vaadin/react-components';
import { nanoid } from 'nanoid';
import '@vaadin/icons';
import '@vaadin/vaadin-lumo-styles/icons';
import './index.css';
import { Assistant, RagContextService } from 'Frontend/generated/endpoints';
import Mermaid from 'Frontend/components/Mermaid.js';

export default function SpringAiAssistant() {
  const [chatId, setChatId] = useState(nanoid());
  const [filesInContext, setFilesInContext] = useState<string[]>([]);
  const [systemMessage, setSystemMessage] = useState<string>('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  async function resetChat() {
    setChatId(nanoid());
  }

  useEffect(() => {
    getContextFiles();
  }, []);

  function getContextFiles() {
    return RagContextService.getFilesInContext().then(setFilesInContext);
  }

  const toggleSettingsOpen = () => {
    setSettingsOpen(!settingsOpen);
  };

  const handleSystemMessageChange = (event: any) => {
    setSystemMessage(event.target.value);
  };

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
          options={{ systemMessage }}
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
          <TextArea
            label="System Message"
            value={systemMessage}
            onChange={handleSystemMessageChange}
            style={{
              height: '100px',
            }}
          />
          <h4 className="settings-sub-heading">RAG data sources</h4>

          <ul>
            {filesInContext.map((file) => (
              <li key={file}>{file}</li>
            ))}
          </ul>

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
