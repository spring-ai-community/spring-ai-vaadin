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
    <div className="main-layout flex box-border h-full overflow-hidden">
      <div className="flex-grow flex flex-col p-m sm:p-s">
        <header className="flex gap-s items-center px-m">
          <h1 className="text-l flex-grow flex items-center gap-m">
            <span className="pr-s">🌱</span>
            <span>Spring AI Assistant</span>
          </h1>

          <Button onClick={resetChat} theme="icon small contrast tertiary">
            <Icon icon="lumo:reload" />
            <Tooltip slot="tooltip" text="Clear chat" />
          </Button>

          <Button onClick={toggleSettingsOpen} theme="icon small contrast tertiary">
            <Icon icon="lumo:cog" />
            <Tooltip slot="tooltip" text="Settings" />
          </Button>
        </header>

        <Chat
          chatId={chatId}
          className="flex-grow"
          service={Assistant}
          acceptedFiles="image/*,text/*,application/pdf"
          options={{ systemMessage }}
          renderer={renderer}
        />
      </div>

      <div
        className={`
          w-full
          border-l 
          border-contrast-10 
          flex 
          flex-col 
          gap-m 
          p-m 
          ${settingsOpen ? 'block' : 'hidden'}
        `}
        style={{
          width: '30%',
          minWidth: '500px',
        }}>
        <div className="flex justify-between items-center">
          <h3>Settings</h3>
          <Button onClick={toggleSettingsOpen} theme="icon small contrast tertiary">
            <Icon icon="lumo:cross" />
            <Tooltip slot="tooltip" text="Close settings" />
          </Button>
        </div>

        <h4 className="text-m">General settings</h4>
        <TextArea
          label="System Message"
          value={systemMessage}
          onChange={handleSystemMessageChange}
          style={{
            height: '100px',
          }}
        />
        <h4 className="text-m">RAG data sources</h4>

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
    </div>
  );
}
