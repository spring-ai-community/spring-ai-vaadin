import ChatMessage from 'Frontend/components/ChatMessage';
import { Button, Icon, Scroller, TextArea } from '@vaadin/react-components';
import './Chat.css';
import send from './send.svg?url';
import { useSignal } from '@vaadin/hilla-react-signals';

interface ChatProps {
  messages: Message[];
  onNewMessage: (message: string) => void;
  disabled?: boolean;
}

export interface Message {
  role: 'assistant' | 'user';
  content: string;
}

export function Chat({ messages, onNewMessage, disabled = false }: ChatProps) {
  const message = useSignal('');

  function onSubmit() {
    onNewMessage(message.value);
    message.value = '';
  }

  return (
    <div className="vaadin-chat-component">
      <Scroller className="flex-grow">
        {messages.map((message, index) => (
          <ChatMessage message={message} key={index} />
        ))}
      </Scroller>

      <div className="input-container p-s">
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
          <Button theme="icon tertiary small" slot="suffix" onClick={onSubmit} disabled={disabled || !message}>
            <Icon src={send} />
          </Button>
        </TextArea>
      </div>
    </div>
  );
}
