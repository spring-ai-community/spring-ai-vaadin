import { Button, Icon, Tooltip } from '@vaadin/react-components';
import '@vaadin/icons';
import '@vaadin/vaadin-lumo-styles/icons';
import styles from './ChatHeader.module.css';

interface ChatHeaderProps {
  onNewChat: () => void;
  onToggleSettings: () => void;
}

export default function ChatHeader({ onNewChat, onToggleSettings }: ChatHeaderProps) {
  return (
    <header className={styles.chatHeader}>
      <h1 className={styles.chatHeading}>
        <span>🌱</span>
        <span>Spring AI Assistant</span>
      </h1>

      <Button onClick={onNewChat} theme="icon small contrast tertiary">
        <Icon icon="lumo:plus" />
        <Tooltip slot="tooltip" text="New chat" />
      </Button>

      <Button onClick={onToggleSettings} theme="icon small contrast tertiary">
        <Icon icon="lumo:cog" />
        <Tooltip slot="tooltip" text="Settings" />
      </Button>
    </header>
  );
}
