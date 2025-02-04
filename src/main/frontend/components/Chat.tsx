import ChatMessage from 'Frontend/components/ChatMessage';
import { Button, Icon, Scroller, TextArea } from '@vaadin/react-components';
import './Chat.css';
import send from './send.svg?url';
import { useSignal } from '@vaadin/hilla-react-signals';
import Dropzone from 'dropzone';
import 'dropzone/dist/basic.css';
import { useEffect } from 'react';

interface ChatProps {
  messages: Message[];
  onNewMessage: (message: string, files?: File[]) => void;
  onFileAdded?: (file: File) => void;
  disabled?: boolean;
}

export interface Message {
  role: 'assistant' | 'user';
  content: string;
}

export function Chat({ messages, onNewMessage, onFileAdded, disabled = false }: ChatProps) {
  const message = useSignal('');
  const dropzone = useSignal<Dropzone>();

  function onSubmit() {
    onNewMessage(message.value, dropzone.value?.files);
    message.value = '';
    dropzone.value?.removeAllFiles();
  }

  useEffect(() => {
    if (onFileAdded) {
      dropzone.value = new Dropzone('.vaadin-chat-component', {
        url: '/file/post',
        previewsContainer: '.dropzone-previews',
        autoProcessQueue: false,
        addRemoveLinks: true,
        acceptedFiles: 'image/*',
        dictInvalidFileType: 'Only images are allowed for now',
      });

      dropzone.value.on('addedfile', (file) => onFileAdded(file));
    }

    return () => {
      dropzone.value?.destroy();
    };
  }, []);

  return (
    <div className={`vaadin-chat-component dropzone`}>
      <Scroller className="flex-grow">
        {messages.map((message, index) => (
          <ChatMessage message={message} key={index} />
        ))}
      </Scroller>

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
            hidden={!onFileAdded}>
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
