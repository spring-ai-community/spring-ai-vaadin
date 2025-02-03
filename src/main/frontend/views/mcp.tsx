import {useState} from "react";
import {Chat, Message} from "Frontend/components/Chat";
import {Button, Icon, Tooltip} from "@vaadin/react-components";
import {ChatMemoryService, McpAssistant} from "Frontend/generated/endpoints";
import {nanoid} from "nanoid";
import "@vaadin/icons";
import "@vaadin/vaadin-lumo-styles/icons";
import { ViewConfig } from "@vaadin/hilla-file-router/types.js";

export const config: ViewConfig = {
    title: 'MCP Assistant',
    menu: {
        order: 3,
    }
}

export default function McpView() {
    const [working, setWorking] = useState(false);
    const [chatId, setChatId] = useState(nanoid());
    const [messages, setMessages] = useState<Message[]>([]);

    async function resetChat() {
        setMessages([]);
        await ChatMemoryService.clearChatMemory(chatId);
        setChatId(nanoid());
    }

    async function getCompletion(userMessage: string) {
        setWorking(true);
        setMessages(msgs => [...msgs, {role: 'user', content: userMessage}]);

        try {
            const response = await McpAssistant.call(chatId, userMessage);
            setMessages(msgs => [...msgs, {role: 'assistant', content: response}]);
        } catch (error) {
            console.error('Error getting completion:', error);
        } finally {
            setWorking(false);
        }
    }

    return (
        <div className="main-layout flex flex-col">
            <header className="flex gap-s items-center px-m">
                <h1 className="text-l flex-grow flex items-center gap-m">
                    <span className="pr-s">🤖</span>
                    <span>MCP Assistant</span>
                </h1>

                <Button onClick={resetChat} theme="icon small contrast tertiary">
                    <Icon icon="lumo:reload"/>
                    <Tooltip slot="tooltip" text="Clear chat"/>
                </Button>
            </header>

            <Chat
                messages={messages}
                onNewMessage={getCompletion}
                disabled={working}
            />
        </div>
    );
}
