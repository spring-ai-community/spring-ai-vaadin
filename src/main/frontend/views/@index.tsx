import { useCallback, useEffect, useState } from 'react';
import { Button, Checkbox, Icon, TextArea, Tooltip, Upload, UploadElement, UploadFile } from '@vaadin/react-components';
import { nanoid } from 'nanoid';
import '@vaadin/icons';
import '@vaadin/vaadin-lumo-styles/icons';
import './index.css';
import { Assistant, RagContextService } from 'Frontend/generated/endpoints';
import Chat, { ChatMessageListItem } from 'Frontend/components/Chat';
import ChatOptions from 'Frontend/generated/org/spring/framework/ai/vaadin/service/Assistant/ChatOptions';
import { useForm } from '@vaadin/hilla-react-form';
import ChatOptionsModel from 'Frontend/generated/org/spring/framework/ai/vaadin/service/Assistant/ChatOptionsModel';
import Message from 'Frontend/generated/org/spring/framework/ai/vaadin/service/Assistant/Message.js';

const defaultOptions: ChatOptions = {
  systemMessage: '',
  useMcp: false,
};

interface AttachmentFile extends UploadFile {
  attachmentId: string;
}

function createItem(message: Message): ChatMessageListItem {
  return {
    text: message.content || '',
    userName: message.role === 'assistant' ? 'Assistant' : 'User',
    userColorIndex: message.role === 'assistant' ? 1 : 0,
    attachments: message.attachments,
  };
}

export default function SpringAiAssistant() {
  const [chatId, setChatId] = useState(nanoid());
  const [filesInContext, setFilesInContext] = useState<string[]>([]);
  const [chatFiles, setChatFiles] = useState<UploadFile[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [items, setItems] = useState<ChatMessageListItem[]>([]);
  const [chatDisabled, setChatDisabled] = useState(false);

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

  const handleChatFilesChanged = useCallback(
    async (files: UploadFile[]) => {
      setChatFiles((chatFiles) => {
        // Handle file remove
        const removedFiles = chatFiles.filter((file) => !files.includes(file));
        removedFiles.forEach((file) => Assistant.removeAttachment(chatId, (file as AttachmentFile).attachmentId));
        return files;
      });
    },
    [chatId],
  );

  const handleChatSubmit = useCallback(
    async (message: string) => {
      setChatDisabled(true);

      const attachments = chatFiles.map((file) => ({
        type: file.type,
        fileName: file.name,
        url: URL.createObjectURL(file),
        key: '',
      }));
      setItems((prevMessages) => [...prevMessages, createItem({ content: message, role: 'user', attachments })]);
      setChatFiles([]);

      const newAssistantItem = createItem({ content: '', role: 'assistant' });

      setItems((prevMessages) => [...prevMessages, newAssistantItem]);
      Assistant.stream(chatId, message, value)
        .onNext((token) => {
          newAssistantItem.text += token;
          setItems((items) => [...items]);
        })
        .onComplete(() => setChatDisabled(false));
    },
    [chatId, value, chatFiles],
  );

  const handleChatUploadRequest = useCallback(
    async (file: File) => {
      const attachmentId = await Assistant.uploadAttachment(chatId, file);
      (file as AttachmentFile).attachmentId = attachmentId;
    },
    [chatId],
  );

  useEffect(() => {
    Assistant.getHistory(chatId).then((history) => setItems(history.map(createItem)));

    return () => {
      Assistant.closeChat(chatId);
    };
  }, [chatId]);

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
          className="chat-component"
          disabled={chatDisabled}
          acceptedFiles="image/*,text/*,application/pdf"
          items={items}
          files={chatFiles}
          onFilesChanged={handleChatFilesChanged}
          onUploadRequest={handleChatUploadRequest}
          onSubmit={handleChatSubmit}
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

          <Checkbox label="Use web search (MCP)" {...field(model.useMcp)} />

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
