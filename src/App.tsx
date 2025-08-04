import { useEffect, useRef, useState } from "react";
import { IoSend } from "react-icons/io5";
import { MdLogout } from "react-icons/md";

// 1. Define types for message structures
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
  // 2. Type your state and refs
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
  const wsUrl = import.meta.env.VITE_WEBSOCKET_URL;

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
        if (data.type === "system") {
          setMessages((m) => [...m, {
            type: "system",
            content: data.message,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }]);
        } else if (data.type === "chat") {
          setMessages((m) => [...m, {
            type: "chat",
            sender: data.sender,
            content: data.message,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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

  // 3. Type your event handlers
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

  // Join Screen
  if (!hasJoinedRoom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-stone-950 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.03),transparent_50%)] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.02),transparent_50%)] pointer-events-none"></div>
        
        <div className="relative bg-neutral-900/60 backdrop-blur-xl border border-neutral-800/50 rounded-3xl p-8 w-full max-w-md shadow-2xl shadow-black/20">
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-800/5 to-transparent rounded-3xl pointer-events-none"></div>
          
          <div className="relative space-y-8">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-neutral-700 to-neutral-800 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg"></div>
              </div>
              <h1 className="text-2xl font-semibold text-neutral-100 tracking-tight">Join Conversation</h1>
              <p className="text-neutral-400 text-sm">Enter your details to connect</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-neutral-300 text-sm font-medium">Display Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full p-4 bg-neutral-800/50 border border-neutral-700/50 rounded-2xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 focus:bg-neutral-800/70 transition-all duration-200"
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-neutral-300 text-sm font-medium">Room Code</label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Enter room ID"
                  className="w-full p-4 bg-neutral-800/50 border border-neutral-700/50 rounded-2xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 focus:bg-neutral-800/70 transition-all duration-200"
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                />
              </div>

              <button
                onClick={handleJoinRoom}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-900 font-semibold py-4 px-6 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg shadow-amber-500/20 active:scale-[0.98]"
              >
                Enter Room
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chat Screen
  return (
    <div className="h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-stone-950 text-neutral-100 flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.02),transparent_50%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.01),transparent_50%)] pointer-events-none"></div>
      
      {/* Header */}
      <header className="relative bg-neutral-900/40 backdrop-blur-xl border-b border-neutral-800/30 p-6 z-10">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full"></div>
              <h1 className="text-lg font-semibold text-neutral-100">
                <span className="text-neutral-400 font-normal">Room</span> {currentRoom}
              </h1>
            </div>
            <p className="text-sm text-neutral-500 ml-6">Signed in as {currentUser}</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 px-3 py-2 bg-neutral-800/30 rounded-full">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-red-400 shadow-lg shadow-red-400/50'} ${isConnected ? 'animate-pulse' : ''}`}></div>
              <span className="text-xs font-medium text-neutral-400">{connectionStatus}</span>
            </div>
            
            <button
              onClick={handleLeaveRoom}
              className="p-2.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800/50 rounded-xl transition-all duration-200"
              title="Leave Room"
            >
              <MdLogout size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
            <div className="w-16 h-16 bg-neutral-800/50 rounded-2xl flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg opacity-50"></div>
            </div>
            <div>
              <p className="text-neutral-400 text-lg font-medium">Ready to chat</p>
              <p className="text-neutral-500 text-sm">Send a message to get started</p>
            </div>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.type === 'system' ? 'justify-center' : msg.isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            {msg.type === 'system' ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-neutral-800/30 rounded-full">
                <div className="w-1.5 h-1.5 bg-neutral-500 rounded-full"></div>
                <span className="text-xs text-neutral-400 font-medium">{msg.content}</span>
              </div>
            ) : (
              <div className={`flex flex-col max-w-sm md:max-w-md ${msg.isOwnMessage ? 'items-end' : 'items-start'}`}>
                {!msg.isOwnMessage && (
                  <div className="flex items-center gap-2 mb-2 ml-4">
                    <div className="w-2 h-2 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full"></div>
                    <p className="text-xs font-medium text-neutral-400">{msg.sender}</p>
                  </div>
                )}
                
                <div className={`relative px-5 py-4 rounded-3xl shadow-lg ${
                  msg.isOwnMessage
                    ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-neutral-900 rounded-br-md shadow-amber-500/10'
                    : 'bg-neutral-800/60 backdrop-blur-sm text-neutral-100 rounded-bl-md border border-neutral-700/30'
                }`}>
                  <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                  {msg.isOwnMessage && <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl rounded-br-md pointer-events-none"></div>}
                </div>
                
                <p className="text-xs text-neutral-500 mt-2 px-2 font-medium">{msg.timestamp}</p>
              </div>
            )}
          </div>
        ))}
        <div ref={messageEndRef} />
      </main>

      {/* Input Area */}
      <footer className="relative bg-neutral-900/40 backdrop-blur-xl border-t border-neutral-800/30 p-6">
        <div className="flex gap-4 items-end">
          <div className="flex-1 relative">
            <input
              type="text"
              ref={inputRef}
              placeholder="Type your message..."
              className="w-full p-4 pr-12 bg-neutral-800/50 border border-neutral-700/50 rounded-2xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50 focus:bg-neutral-800/70 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              onKeyPress={handleKeyPress}
              disabled={!isConnected}
            />
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!isConnected}
            className="p-4 bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 rounded-2xl text-neutral-900 shadow-lg shadow-amber-500/20 transform hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <IoSend size={18} />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;