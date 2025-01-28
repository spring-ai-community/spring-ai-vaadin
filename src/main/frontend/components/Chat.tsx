import ChatMessage from "Frontend/components/ChatMessage";
import {MessageInput, Scroller} from "@vaadin/react-components";
import "./Chat.css";

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

  return (
    <div className="vaadin-chat-component">
      <Scroller className="flex-grow">
        {messages.map((message, index) => <ChatMessage message={message} key={index} />)}
      </Scroller>

      <MessageInput
        disabled={disabled}
        className="p-s"
        style={{ '--mask-image': 'url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="black"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>\')' }}
        onSubmit={e => onNewMessage(e.detail.value)} />
    </div>
  );
}
