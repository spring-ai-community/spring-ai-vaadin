import { Button, Checkbox, Icon, TextArea, Tooltip, Upload, UploadElement } from '@vaadin/react-components';
import { RagContextService } from 'Frontend/generated/endpoints';
import { FieldDirectiveResult } from '@vaadin/hilla-react-form';
import styles from './SettingsPanel.module.css';
import '@vaadin/icons';
import '@vaadin/vaadin-lumo-styles/icons';

interface SettingsPanelProps {
  toggleSettingsOpen: () => void;
  filesInContext: string[];
  getContextFiles: () => Promise<void>;
  systemMessageField: FieldDirectiveResult;
  useMcpField: FieldDirectiveResult;
  className?: string;
}

export default function SettingsPanel({
  toggleSettingsOpen,
  filesInContext,
  getContextFiles,
  systemMessageField,
  useMcpField,
  className,
}: SettingsPanelProps) {
  return (
    <div className={[className, styles.settingsPanel].join(' ')}>
      <div className={styles.settingsHeader}>
        <h3>Settings</h3>
        <Button onClick={toggleSettingsOpen} theme="icon small contrast tertiary">
          <Icon icon="lumo:cross" />
          <Tooltip slot="tooltip" text="Close settings" />
        </Button>
      </div>

      <h4 className={styles.settingsSubHeading}>General settings</h4>
      <TextArea label="System Message" {...systemMessageField} minRows={3} />

      <Checkbox label="Use web search (MCP)" {...useMcpField} />

      <h4 className={styles.settingsSubHeading}>RAG data sources</h4>

      {filesInContext.length > 0 && (
        <ul>
          {filesInContext.map((file) => (
            <li key={file}>{file}</li>
          ))}
        </ul>
      )}

      <Upload
        maxFiles={10}
        maxFileSize={10 * 1024 * 1024}
        accept=".txt,.pdf,.md,.doc,.docx"
        onUploadRequest={async (e) => {
          e.preventDefault();

          await RagContextService.addFileToContext(e.detail.file);

          getContextFiles();
          // Clear the file input
          (e.target as UploadElement).files = [];
        }}
      />
    </div>
  );
}
