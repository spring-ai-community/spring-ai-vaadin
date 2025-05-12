import { useCallback, useMemo } from 'react';
import {
  MessageInput,
  MessageInputSubmitEvent,
  MessageList,
  MessageListItem,
  Scroller,
  Upload,
  UploadFile,
  UploadFilesChangedEvent,
  UploadRequestEvent,
} from '@vaadin/react-components';
import styles from './Chat.module.css';

interface Attachment {
  type: string;
  fileName: string;
  url: string;
}

export interface ChatMessageListItem extends MessageListItem {
  attachments?: Attachment[];
}

interface ChatProps {
  items: ChatMessageListItem[];
  files: UploadFile[];
  disabled: boolean;
  onSubmit: (message: string) => void;
  onFilesChanged: (files: UploadFile[]) => void;
  onUploadRequest: (file: File) => Promise<void>;
  acceptedFiles?: string;
  className?: string;
}

/**
 * Chat component that displays messages and allows sending new messages and uploading files.
 */
export default function Chat({
  items,
  files,
  disabled,
  onSubmit,
  onFilesChanged,
  onUploadRequest,
  acceptedFiles,
  className,
}: ChatProps) {
  // Event handlers
  const handleSubmit = useCallback(
    (e: MessageInputSubmitEvent) => {
      onSubmit(e.detail.value);
    },
    [onSubmit],
  );

  const handleFilesChanged = useCallback(
    (e: UploadFilesChangedEvent) => onFilesChanged(e.detail.value),
    [onFilesChanged],
  );

  const handleUploadRequest = useCallback(
    async (e: UploadRequestEvent) => {
      await onUploadRequest(e.detail.file);
    },
    [onUploadRequest],
  );

  // Transform chat items to display typing indicator and attachments
  const transformedItems = useMemo(() => {
    return items.map((item) => {
      // Handle loading state
      if (!item.text) {
        return {
          ...item,
          text: `<div class="${styles.typingIndicator}"></div>`,
        };
      }

      // Handle attachments
      if (item.attachments?.length) {
        const attachmentText = item.attachments.map((attachment) => attachment.fileName).join('\n');

        return {
          ...item,
          text: `${attachmentText}\n${item.text}`,
        };
      }

      return item;
    });
  }, [items]);

  return (
    <div className={[className, styles.chat].join(' ')}>
      <Scroller className={styles.messageList}>
        <MessageList markdown items={transformedItems} />
      </Scroller>

      <Upload
        className={styles.upload}
        files={files}
        maxFiles={10}
        maxFileSize={10 * 1024 * 1024}
        accept={acceptedFiles}
        disabled={disabled}
        onFilesChanged={handleFilesChanged}
        onUploadRequest={handleUploadRequest}>
        <MessageInput className={styles.input} disabled={disabled} onSubmit={handleSubmit} />
      </Upload>
    </div>
  );
}
