import { useEffect, useRef, useState } from "react";
import { IoSend } from "react-icons/io5";
import { MdLogout } from "react-icons/md";

// Type definitions are unchanged
interface SystemMessage {
  type: 'system';
  content: string;
  timestamp: string;
}
interface ChatMessage {
  type: 'chat';
  sender: string;
  content: string;
  timestamp: string;
  isOwnMessage: boolean;
}
type Message = SystemMessage | ChatMessage;

const App = () => {
  // All state, refs, and functionality are preserved
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [userName, setUserName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const [currentRoom, setCurrentRoom] = useState("");
  const [currentUser, setCurrentUser] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!hasJoinedRoom) return;
    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080';

    if (!wsUrl) {
      console.error("VITE_WEBSOCKET_URL environment variable is not set");
      setConnectionStatus("Configuration Error");
      return;
    }

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("Connected to backend");
      setIsConnected(true);
      setConnectionStatus("Connected");
      ws.send(JSON.stringify({
        type: "join",
        payload: { roomId: currentRoom, userName: currentUser },
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (data.type === "system") {
          setMessages((m) => [...m, {
            type: "system",
            content: data.message,
            timestamp: timestamp,
          }]);
        } else if (data.type === "chat") {
          setMessages((m) => [...m, {
            type: "chat",
            sender: data.sender,
            content: data.message,
            timestamp: timestamp,
            isOwnMessage: data.sender === currentUser,
          }]);
        }
      } catch (error) {
        console.error("Error parsing message data:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
      setIsConnected(false);
      setConnectionStatus("Disconnected");
    };

    ws.onerror = (error) => {
      console.log("Websocket error: ", error);
      setConnectionStatus("Error");
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [hasJoinedRoom, currentRoom, currentUser]);

  const handleJoinRoom = () => {
    if (!userName.trim() || !roomId.trim()) {
      alert("Please enter both your name and room ID");
      return;
    }
    setCurrentUser(userName.trim());
    setCurrentRoom(roomId.trim());
    setHasJoinedRoom(true);
    setMessages([]);
  };

  const handleSendMessage = () => {
    const message = inputRef.current?.value?.trim();
    if (!message || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({
      type: "chat",
      payload: { message: message, sender: currentUser },
    }));

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const handleLeaveRoom = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
    setHasJoinedRoom(false);
    setMessages([]);
    setCurrentRoom("");
    setCurrentUser("");
    setUserName("");
    setRoomId("");
  };

  // --- REFINED UI/UX ---

  if (!hasJoinedRoom) {
    return (
      <main className="min-h-screen bg-neutral-950 text-neutral-200 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(120,119,198,0.05),transparent_40%)] pointer-events-none"></div>
        <div className="w-full max-w-md">
          <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-2xl p-8 space-y-8 shadow-2xl shadow-black/20">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-neutral-100 tracking-tight">Join Room</h1>
              <p className="text-neutral-400">Enter your details to start chatting.</p>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Your Name"
                className="w-full p-4 bg-neutral-800/50 border border-neutral-700/60 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-200"
                onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
              />
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Room Code"
                className="w-full p-4 bg-neutral-800/50 border border-neutral-700/60 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-200"
                onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
              />
              <button
                onClick={handleJoinRoom}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-amber-500/20 active:scale-[0.99]"
              >
                Enter Conversation
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="h-screen bg-neutral-950 text-neutral-200 flex flex-col font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(120,119,198,0.04),transparent_50%)] pointer-events-none"></div>

      {/* Header */}
      <header className="shrink-0 bg-neutral-950/80 backdrop-blur-lg border-b border-neutral-800 p-4 z-10">
        <div className="flex justify-between items-center max-w-5xl mx-auto">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-neutral-100 truncate">{currentRoom}</h1>
            <p className="text-sm text-neutral-400 truncate">as {currentUser}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-neutral-800/60 border border-neutral-700/50 rounded-full">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-500'} transition-colors`}></div>
              <span className="text-xs font-medium text-neutral-400 hidden sm:inline">{connectionStatus}</span>
            </div>
            <button onClick={handleLeaveRoom} className="p-2 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-full transition-colors" title="Leave Room">
              <MdLogout size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-20 opacity-50">
              <div className="w-24 h-24 bg-neutral-900 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 5.523-4.477 10-10 10S1 17.523 1 12 5.477 2 12 2s10 4.477 10 10z" /></svg>
              </div>
              <p className="text-neutral-300 text-lg font-medium">It's quiet in here...</p>
              <p className="text-neutral-500 text-sm">Send a message to start the conversation.</p>
            </div>
          )}
          
          {messages.map((msg, index) => (
            <div key={index} className={`flex text-sm ${msg.type === 'system' ? 'justify-center' : msg.isOwnMessage ? 'justify-end' : 'justify-start'}`}>
              {msg.type === 'system' ? (
                <span className="px-3 py-1 bg-neutral-800 text-neutral-400 text-xs rounded-full">{msg.content}</span>
              ) : (
                <div className={`flex flex-col max-w-[80%] sm:max-w-md ${msg.isOwnMessage ? 'items-end' : 'items-start'}`}>
                  {!msg.isOwnMessage && (
                    <span className="text-xs text-neutral-400 mb-1 ml-3">{msg.sender}</span>
                  )}
                  <div className={`px-4 py-3 rounded-2xl shadow-md ${
                    msg.isOwnMessage
                      ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-br-lg'
                      : 'bg-neutral-800 text-neutral-200 rounded-bl-lg'
                  }`}>
                    <p className="leading-relaxed break-words">{msg.content}</p>
                  </div>
                  <span className="text-xs text-neutral-500 mt-2 px-2">{msg.timestamp}</span>
                </div>
              )}
            </div>
          ))}
          <div ref={messageEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="shrink-0 bg-neutral-950/80 backdrop-blur-lg border-t border-neutral-800 p-4 z-10">
        <div className="flex gap-4 items-center max-w-5xl mx-auto">
          <input
            type="text"
            ref={inputRef}
            placeholder="Type a message..."
            className="w-full p-4 bg-neutral-800/50 border border-neutral-700/60 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-200 disabled:opacity-50"
            onKeyPress={handleKeyPress}
            disabled={!isConnected}
          />
          <button
            onClick={handleSendMessage}
            disabled={!isConnected}
            className="p-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 rounded-xl text-white transform hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 shrink-0"
            aria-label="Send message"
          >
            <IoSend size={20} />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;