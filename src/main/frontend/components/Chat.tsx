import ChatMessage from 'Frontend/components/ChatMessage';
import { Button, Icon, Scroller, TextArea } from '@vaadin/react-components';
import './Chat.css';
import send from './send.svg?url';
import { useSignal } from '@vaadin/hilla-react-signals';
import Dropzone from 'dropzone';
import 'dropzone/dist/basic.css';
import { useEffect, useRef } from 'react';

interface ChatProps {
  messages: Message[];
  onNewMessage: (message: string, files?: File[]) => void;
  acceptedFiles?: string;
  onFileAdded?: (file: File) => void;
  disabled?: boolean;
}

export interface Attachment {
  type: 'image' | 'document';
  key: string;
  fileName: string;
  url: string;
}

export interface Message {
  role: 'assistant' | 'user';
  content: string;
  attachments?: Attachment[];
}

export function Chat({ messages, onNewMessage, onFileAdded, acceptedFiles, disabled = false }: ChatProps) {
  const message = useSignal('');
  const dropzone = useRef<Dropzone>();

  function onSubmit() {
    onNewMessage(
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

      dropzone.current.on('addedfile', (file) => onFileAdded?.(file));
    }

    return () => {
      dropzone.current?.destroy();
    };
  }, []);

  const waiting = messages[messages.length - 1]?.role === 'user';

  return (
    <div className={`vaadin-chat-component dropzone`}>
      <Scroller className="flex-grow">
        {messages.map((message, index) => (
          <ChatMessage message={message} key={index} />
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
          disabled={disabled}
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
            disabled={disabled}
            hidden={!acceptedFiles}>
            <Icon icon="vaadin:upload" />
          </Button>

          <Button theme="icon tertiary small" slot="suffix" onClick={onSubmit} disabled={disabled || !message.value}>
            <Icon src={send} />
          </Button>
        </TextArea>
      </div>

      <div className="drop-curtain">Drop a file here to add it to the chat 📁</div>
    </div>
  );
}
