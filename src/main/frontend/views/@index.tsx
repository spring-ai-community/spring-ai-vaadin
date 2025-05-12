import { useCallback, useEffect, useState } from 'react';
import type { UploadFile } from '@vaadin/react-components';
import { nanoid } from 'nanoid';
import './index.css';
import { Assistant, RagContextService } from 'Frontend/generated/endpoints';
import Chat, { ChatMessageListItem } from 'Frontend/components/Chat';
import ChatOptions from 'Frontend/generated/org/spring/framework/ai/vaadin/service/Assistant/ChatOptions';
import { useForm } from '@vaadin/hilla-react-form';
import ChatOptionsModel from 'Frontend/generated/org/spring/framework/ai/vaadin/service/Assistant/ChatOptionsModel';
import Message from 'Frontend/generated/org/spring/framework/ai/vaadin/service/Assistant/Message.js';
import Attachment from 'Frontend/generated/org/spring/framework/ai/vaadin/service/Assistant/Attachment.js';
import SettingsPanel from 'Frontend/components/SettingsPanel';
import ChatHeader from 'Frontend/components/ChatHeader';

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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

async function fileToAttachment(file: File): Promise<Attachment> {
  return {
    type: file.type,
    fileName: file.name,
    url: file.type.startsWith('image/') ? await fileToBase64(file) : '',
    key: '',
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

      const attachments = await Promise.all(chatFiles.map(fileToAttachment));
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
        <ChatHeader onNewChat={resetChat} onToggleSettings={toggleSettingsOpen} />

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
        <SettingsPanel
          className="settings-panel"
          toggleSettingsOpen={toggleSettingsOpen}
          filesInContext={filesInContext}
          getContextFiles={getContextFiles}
          systemMessageField={field(model.systemMessage)}
          useMcpField={field(model.useMcp)}
        />
      )}
    </div>
  );
}
