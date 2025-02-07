import { useEffect, useState } from 'react';
import { Attachment, Chat, Message } from 'Frontend/components/Chat';
import { Button, Icon, Tooltip, Dialog, TextArea } from '@vaadin/react-components';
import { nanoid } from 'nanoid';
import '@vaadin/icons';
import '@vaadin/vaadin-lumo-styles/icons';
import './index.css';
import { ViewConfig } from '@vaadin/hilla-file-router/types.js';
import { BasicAssistant, ChatMemoryService } from 'Frontend/generated/endpoints';

export const config: ViewConfig = {
  title: 'Basic AI Chat',
  menu: {
    order: 1,
  },
};

export default function VaadinDocsAssistant() {
  const [working, setWorking] = useState(false);
  const [chatId, setChatId] = useState(nanoid());
  const [systemMessage, setSystemMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  async function resetChat() {
    setMessages([]);
    await ChatMemoryService.clearChatMemory(chatId);
    setChatId(nanoid());
  }

  function appendToLastMessage(token: string) {
    setMessages((msgs) => {
      const lastMessage = msgs[msgs.length - 1];
      lastMessage.content += token;
      return [...msgs.slice(0, -1), lastMessage];
    });
  }

  async function addAttachment(file: File) {
    const attachmentId = await BasicAssistant.uploadAttachment(file);
    (file as any).__attachmentId = attachmentId;
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
    BasicAssistant.stream(chatId, systemMessage, userMessage, attachmentIds)
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

  const handleSettingsOpen = () => {
    setSettingsOpen(true);
  };

  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };

  const handleSystemMessageChange = (event: any) => {
    setSystemMessage(event.target.value);
  };

  return (
    <div className="main-layout flex flex-col">
      <header className="flex gap-s items-center px-m">
        <h1 className="text-l flex-grow flex items-center gap-m">
          <span className="pr-s">🌱</span>
          <span>Spring AI Assistant</span>
        </h1>

        <Button onClick={resetChat} theme="icon small contrast tertiary">
          <Icon icon="lumo:reload" />
          <Tooltip slot="tooltip" text="Clear chat" />
        </Button>

        <Button onClick={handleSettingsOpen} theme="icon small contrast tertiary">
          <Icon icon="lumo:cog" />
          <Tooltip slot="tooltip" text="Settings" />
        </Button>
      </header>

      <Chat
        messages={messages}
        onNewMessage={getCompletion}
        acceptedFiles="image/*,text/*,application/pdf"
        onFileAdded={addAttachment}
        disabled={working}
      />

      <Dialog opened={settingsOpen} onClosed={handleSettingsClose}>
        <div className="flex flex-col gap-s">
          <h3>Settings</h3>
          <TextArea
            label="System Message"
            value={systemMessage}
            onChange={handleSystemMessageChange}
            style={{
              width: '500px',
              height: '100px',
            }}
          />
          <Button onClick={handleSettingsClose} className="self-start" theme="primary">
            Save
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
