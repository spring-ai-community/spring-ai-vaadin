import ChatMessage from 'Frontend/components/ChatMessage';
import { Button, Icon, Scroller, TextArea } from '@vaadin/react-components';
import './Chat.css';
import send from './send.svg?url';
import { useSignal } from '@vaadin/hilla-react-signals';
import Dropzone from 'dropzone';
import 'dropzone/dist/basic.css';
import { useEffect, useRef, useState } from 'react';
import { Subscription } from '@vaadin/hilla-frontend';
import { Assistant } from 'Frontend/generated/endpoints';
import Message from 'Frontend/generated/org/spring/framework/ai/vaadin/service/AiChatService/Message';
import Attachment from 'Frontend/generated/org/spring/framework/ai/vaadin/service/AiChatService/Attachment';

// Move these
interface AiChatServiceOptions {
  systemMessage: string;
  attachmentIds: string[];
}

interface AiChatService {
  stream(chatId: string, userMessage: string, options: AiChatServiceOptions): Subscription<string>;

  getHistory(chatId: string): Promise<Message[]>;

  closeChat(chatId: string): Promise<void>;

  uploadAttachment(chatId: string, file: File): Promise<string>;
}

// --

interface ChatOptions {
  systemMessage: string;
}

interface ChatProps {
  chatId: string;
  service: AiChatService;
  acceptedFiles?: string;
  options?: ChatOptions;
  renderer?: Parameters<typeof ChatMessage>[0]['renderer'];
  className?: string;
}

export function Chat({
  chatId,
  service,
  acceptedFiles,
  options = { systemMessage: '' },
  renderer,
  className,
}: ChatProps) {
  const [working, setWorking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const message = useSignal('');
  const dropzone = useRef<Dropzone>();

  useEffect(() => {
    service.getHistory(chatId).then(setMessages);
    return () => {
      // Close the previous chat when a new one is started
      service.closeChat(chatId);
    };
  }, [chatId]);

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
    Assistant.stream(chatId, userMessage, { systemMessage: options?.systemMessage, attachmentIds })
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

  function onSubmit() {
    getCompletion(
      message.value,
      dropzone.current?.files.filter((file) => file.accepted),
    );
    message.value = '';
    dropzone.current?.removeAllFiles();
  }

  useEffect(() => {
    if (acceptedFiles) {
      dropzone.current = new Dropzone('.vaadin-chat-component', {
        url: '/file/post',
        previewsContainer: '.dropzone-previews',
        autoProcessQueue: false,
        addRemoveLinks: true,
        acceptedFiles,
        maxFilesize: 5,
      });

      dropzone.current.on('addedfile', (file) => addAttachment(file));
    }

    return () => {
      dropzone.current?.destroy();
    };
  }, []);

  const waiting = messages[messages.length - 1]?.role === 'user';

  return (
    <div className={`vaadin-chat-component dropzone ${className}`}>
      <Scroller className="flex-grow">
        {messages.map((message, index) => (
          <ChatMessage message={message} key={index} renderer={renderer} />
        ))}
        {waiting ? <ChatMessage waiting message={{ role: 'assistant', content: '' }} /> : null}
      </Scroller>

      {waiting ? (
        <style>
          {`
            .v-loading-indicator {
              display: none !important;
            }
          `}
        </style>
      ) : null}

      <div className="input-container p-s">
        <div className="dropzone-previews" dangerouslySetInnerHTML={{ __html: '' }}></div>

        <TextArea
          className="input"
          minRows={1}
          disabled={working}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSubmit();
            }
          }}
          onValueChanged={(e) => (message.value = e.detail.value)}
          placeholder="Message"
          value={message.value}>
          <Button
            theme="icon tertiary small"
            className="dz-message"
            slot="suffix"
            disabled={working}
            hidden={!acceptedFiles}>
            <Icon icon="vaadin:upload" />
          </Button>

          <Button theme="icon tertiary small" slot="suffix" onClick={onSubmit} disabled={working || !message.value}>
            <Icon src={send} />
          </Button>
        </TextArea>
      </div>

      <div className="drop-curtain">Drop a file here to add it to the chat 📁</div>
    </div>
  );
}
