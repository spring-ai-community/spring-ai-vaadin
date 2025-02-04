import Markdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-light.css';
import { Icon } from '@vaadin/react-components';
import { Message } from './Chat';

interface MessageProps {
  message: Message;
}

export default function ChatMessage({ message }: MessageProps) {
  const hasAttachments = !!message.attachments?.length;

  return (
    <div className={'flex flex-col sm:flex-row gap-m p-m mt-m' + (message.role !== 'assistant' ? ' me' : '')}>
      <span className="text-2xl" hidden={message.role !== 'assistant'}>
        🤖
      </span>
      <div className="message-content">
        {hasAttachments ? (
          <div className="attachments flex flex-col gap-s">
            {message.attachments?.map((attachment) => {
              if (attachment.type === 'image') {
                return <img key={attachment.key} src={attachment.url} alt={attachment.fileName} />;
              } else {
                return (
                  <div key={attachment.key} className="attachment flex gap-s">
                    <Icon icon="vaadin:file" />
                    <span>{attachment.fileName}</span>
                  </div>
                );
              }
            })}
          </div>
        ) : null}

        <Markdown rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }]]}>{message.content}</Markdown>
      </div>
    </div>
  );
}
