import { useEffect, useRef, useState, useCallback } from 'react';
import { RealtimeService } from 'Frontend/generated/endpoints';
import { Button } from '@vaadin/react-components/Button.js';

export interface VoiceFunction {
  name: string;
  description: string;
  parameters?: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
    minProperties?: number;
  };
  execute: (args: any) => Promise<void> | void;
}

interface VoiceControlProps {
  functions: VoiceFunction[];
}

export function VoiceControl({
  functions,
}: VoiceControlProps) {
  const [isListening, setIsListening] = useState(false);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);

  useEffect(() => {
    return () => {
      peerConnection.current?.close();
    };
  }, []);

  const handleMessage = useCallback(async (msg: any) => {
    if (msg.type === 'response.function_call_arguments.done') {
      const args = JSON.parse(msg.arguments || '{}');
      const fn = functions.find(f => f.name === msg.name);
      
      if (fn) {
        await fn.execute(args);
      }

      // Send function call output
      if (dataChannel.current) {
        const event = {
          type: 'conversation.item.create',
          item: {
            type: 'function_call_output',
            call_id: msg.call_id,
            output: JSON.stringify({ success: true }),
          },
        };
        dataChannel.current.send(JSON.stringify(event));
      }
    }
  }, [functions]);

  // Keep track of the latest message handler
  const latestHandleMessage = useRef(handleMessage);
  useEffect(() => {
    latestHandleMessage.current = handleMessage;
  }, [handleMessage]);

  async function initializeWebRTC() {
    try {
      // Get ephemeral token
      const tokenResponse = await RealtimeService.createEphemeralToken();
      const data = JSON.parse(tokenResponse);
      const EPHEMERAL_KEY = data.client_secret.value;

      // Create peer connection
      peerConnection.current = new RTCPeerConnection();
      const pc = peerConnection.current;

      // Set up audio playback
      const audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
      };

      // Add local audio track
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      // Set up data channel
      dataChannel.current = pc.createDataChannel('oai-events');
      const dc = dataChannel.current;

      dc.addEventListener('open', () => {
        console.log('Data channel opened');
        
        // Set up message handler when data channel opens
        const messageHandler = (ev: MessageEvent) => {
          const msg = JSON.parse(ev.data);
          // Always use the latest message handler from the ref
          latestHandleMessage.current(msg);
        };
        dc.addEventListener('message', messageHandler);
        
        configureTools();
      });

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = 'https://api.openai.com/v1/realtime';
      const model = 'gpt-4o-realtime-preview-2024-12-17';
      
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: 'POST',
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          'Content-Type': 'application/sdp',
        },
      });

      const answer: RTCSessionDescriptionInit = {
        type: 'answer' as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);
      setIsListening(true);
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error);
      setIsListening(false);
    }
  }

  function configureTools() {
    if (!dataChannel.current) return;

    const event = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        tools: functions.map(({ name, description, parameters }) => ({
          type: 'function',
          name,
          description,
          parameters,
        })),
      },
    };

    dataChannel.current.send(JSON.stringify(event));
  }

  return (
    <div className="flex items-center gap-m">
      <Button
        theme={isListening ? 'primary' : 'secondary'}
        onClick={() => {
          if (isListening) {
            peerConnection.current?.close();
            setIsListening(false);
          } else {
            initializeWebRTC();
          }
        }}
      >
        {isListening ? '🎤 Voice Control Active' : '🎤 Enable Voice Control'}
      </Button>
    </div>
  );
}