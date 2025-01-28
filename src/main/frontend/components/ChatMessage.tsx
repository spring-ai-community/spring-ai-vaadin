import Markdown from "react-markdown";
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-light.css';
import { Icon } from "@vaadin/react-components";
import { Message } from "./Chat";


interface MessageProps {
  message: Message
}

export default function ChatMessage({ message }: MessageProps) {
  return (
    <div className={'flex flex-col sm:flex-row gap-m p-m mt-m' + (message.role !== 'assistant' ? ' me' : '')}>
        <span className="text-2xl" hidden={message.role !== 'assistant'}>🤖
        </span>
      <div className="message-content">
        <Markdown
          rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }]]}>
          {message.content}
        </Markdown>
      </div>
    </div>
  );
}
