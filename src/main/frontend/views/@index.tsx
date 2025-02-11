import { useCallback, useEffect, useState } from 'react';
import { Attachment, Chat, Message } from 'Frontend/components/Chat';
import { Button, Icon, Tooltip, TextArea, Upload, UploadElement } from '@vaadin/react-components';
import { nanoid } from 'nanoid';
import '@vaadin/icons';
import '@vaadin/vaadin-lumo-styles/icons';
import './index.css';
import { Assistant, RagContextService } from 'Frontend/generated/endpoints';
import Mermaid from 'Frontend/components/Mermaid.js';

export default function SpringAiAssistant() {
  const [working, setWorking] = useState(false);
  const [chatId, setChatId] = useState(nanoid());
  const [systemMessage, setSystemMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filesInContext, setFilesInContext] = useState<string[]>([]);

  async function resetChat() {
    setMessages([]);
    await Assistant.closeChat(chatId);
    setChatId(nanoid());
  }

  useEffect(() => {
    getContextFiles();
  }, []);

  function appendToLastMessage(token: string) {
    setMessages((msgs) => {
      const lastMessage = msgs[msgs.length - 1];
      lastMessage.content += token;
      return [...msgs.slice(0, -1), lastMessage];
    });
  }

  async function addAttachment(file: File) {
    const attachmentId = await Assistant.uploadAttachment(chatId, file);
    (file as any).__attachmentId = attachmentId;
  }

  function getContextFiles() {
    return RagContextService.getFilesInContext().then(setFilesInContext);
  }

  function getCompletion(userMessage: string, attachments?: File[]) {
    setWorking(true);

    const uploadedAttachments = (attachments || []).filter((file) => '__attachmentId' in file);

    const messageAttachments: Attachment[] = uploadedAttachments.map((file) => {
      const isImage = file.type.startsWith('image/');
      return {
        key: file.__attachmentId as string,
        fileName: file.name,
        type: isImage ? 'image' : 'document',
        url: isImage ? (file as any).dataURL : undefined,
      };
    });

    setMessages((msgs) => [...msgs, { role: 'user', content: userMessage, attachments: messageAttachments }]);

    const attachmentIds = uploadedAttachments.map((file) => file.__attachmentId as string);

    let first = true;
    Assistant.stream(chatId, userMessage, { systemMessage, attachmentIds })
      .onNext((token) => {
        if (first && token) {
          setMessages((msgs) => [...msgs, { role: 'assistant', content: token }]);
          first = false;
        } else {
          appendToLastMessage(token);
        }
      })
      .onError(() => setWorking(false))
      .onComplete(() => setWorking(false));
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
          className="flex-grow"
          messages={messages}
          onNewMessage={getCompletion}
          acceptedFiles="image/*,text/*,application/pdf"
          onFileAdded={addAttachment}
          disabled={working}
          renderer={renderer}
        />
      </div>

      <div
        className={`border-l border-contrast-10 flex flex-col gap-s p-m ${settingsOpen ? 'block' : 'hidden'}`}
        style={{
          width: '30%',
          minWidth: '500px',
        }}>
        <h3>Settings</h3>
        <TextArea
          label="System Message"
          value={systemMessage}
          onChange={handleSystemMessageChange}
          style={{
            height: '100px',
          }}
        />
        <h4>RAG data sources</h4>

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
