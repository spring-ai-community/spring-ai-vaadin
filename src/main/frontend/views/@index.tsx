import { useEffect, useState } from 'react';
import { Chat, Message } from 'Frontend/components/Chat';
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

  function getCompletion(userMessage: string, attachments?: File[]) {
    setWorking(true);
    setMessages((msgs) => [...msgs, { role: 'user', content: userMessage }]);

    let first = true;
    BasicAssistant.stream(
      chatId,
      systemMessage,
      userMessage,
      (attachments || []).filter((file) => '__mediaName' in file).map((file) => file.__mediaName as string),
    )
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
        onFileAdded={(file) => {
          // TODO: Temporary workaround to upload files to the server
          const formData = new FormData();
          formData.append('file', file);

          fetch('/api/attachment', {
            method: 'POST',
            body: formData,
          })
            .then((response) => response.json())
            .then((data) => ((file as any).__mediaName = data.name))
            .catch((error) => console.error('Error uploading file:', error));
        }}
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
