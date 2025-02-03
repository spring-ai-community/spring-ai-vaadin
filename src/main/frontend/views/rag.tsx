import {useEffect, useState} from "react";
import {Chat, Message} from "Frontend/components/Chat";
import {Button, Icon, Tooltip, Dialog, Upload, UploadElement} from "@vaadin/react-components";
import {RagAssistant} from "Frontend/generated/endpoints";
import {nanoid} from "nanoid";
import "@vaadin/icons";
import "@vaadin/vaadin-lumo-styles/icons";
import { ViewConfig } from "@vaadin/hilla-file-router/types.js";

export const config: ViewConfig = {
    title: 'RAG Chat',
    menu: {
        order: 2,
    }
}

export default function RAGView() {
    const [working, setWorking] = useState(false);
    const [chatId, setChatId] = useState(nanoid());
    const [systemMessage, setSystemMessage] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [filesInContext, setFilesInContext] = useState<string[]>([]);

    useEffect(() => {
        getContextFiles();
    }, []);

    async function resetChat() {
        setMessages([]);
        await RagAssistant.clearChatMemory(chatId);
        setChatId(nanoid());
    }

    function appendToLastMessage(token: string) {
        setMessages(msgs => {
            const lastMessage = msgs[msgs.length - 1];
            lastMessage.content += token;
            return [...msgs.slice(0, -1), lastMessage];
        });
    }

    function getCompletion(userMessage: string) {
        setWorking(true);
        setMessages(msgs => [...msgs, {role: 'user', content: userMessage}]);

        let first = true;
        RagAssistant.stream(chatId, systemMessage, userMessage).onNext(token => {
            if (first && token) {
                setMessages(msgs => [...msgs, {role: 'assistant', content: token}]);
                first = false;
            } else {
                appendToLastMessage(token);
            }
        })
            .onError(() => setWorking(false))
            .onComplete(() => setWorking(false))
    }

    function handleSettingsOpen() {
        setSettingsOpen(true);
    }

    function handleSettingsClose() {
        setSettingsOpen(false);
    }

    function getContextFiles() {
        return RagAssistant.getFilesInContext().then(setFilesInContext);
    }

    return (
        <div className="main-layout flex flex-col">
            <header className="flex gap-s items-center px-m">
                <h1 className="text-l flex-grow flex items-center gap-m">
                    <span className="pr-s">🔍</span>
                    <span>Retrieval-Augmented Generation</span>
                </h1>

                <Button onClick={resetChat} theme="icon small contrast tertiary">
                    <Icon icon="lumo:reload"/>
                    <Tooltip slot="tooltip" text="Clear chat"/>
                </Button>

                <Button onClick={handleSettingsOpen} theme="icon small contrast tertiary">
                    <Icon icon="lumo:cog"/>
                    <Tooltip slot="tooltip" text="Settings"/>
                </Button>
            </header>

            <Chat
                messages={messages}
                onNewMessage={getCompletion}
                disabled={working}
            />

            <Dialog opened={settingsOpen} onClosed={handleSettingsClose}>
                <div className="flex flex-col gap-s">
                    <h3>RAG data sources</h3>

                    <ul>
                        {filesInContext.map(file => (
                            <li key={file}>{file}</li>
                        ))}
                    </ul>

                    <Upload 
                        maxFiles={10}
                        maxFileSize={10 * 1024 * 1024}
                        accept=".txt,.pdf,.md,.doc,.docx"
                        target="/api/upload"
                        onUploadSuccess={e => {
                            getContextFiles();
                            // Clear the file input
                            (e.target as UploadElement).files=[];
                        }}
                    />
                    <Button onClick={handleSettingsClose} className="self-start" theme="primary">Close</Button>
                </div>
            </Dialog>
        </div>
    );
}
