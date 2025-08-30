import { useEffect, useRef, useState } from "react";
import { IoSend } from "react-icons/io5";
import { MdLogout } from "react-icons/md";
import { HiUsers } from "react-icons/hi2";
import { BsChatDots } from "react-icons/bs";
import { MdWifi, MdWifiOff } from "react-icons/md";

// Type definitions remain unchanged
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("connecting...");
  const [userName, setUserName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const [currentRoom, setCurrentRoom] = useState("");
  const [currentUser, setCurrentUser] = useState("");
  const [isTyping, setIsTyping] = useState(false);

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
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsTyping(e.target.value.trim().length > 0);
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
    setIsTyping(false);
  };

  // Join Room Screen
  if (!hasJoinedRoom) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-black text-neutral-200 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.02),transparent_50%)] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(245,158,11,0.03),transparent_60%)] pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/2 rounded-full blur-3xl -translate-x-48 -translate-y-48"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl translate-x-48 translate-y-48"></div>
        
        <div className="w-full max-w-md relative z-10">
          <div className="bg-neutral-900/70 backdrop-blur-2xl border border-neutral-800/50 rounded-3xl p-8 space-y-8 shadow-2xl shadow-black/60 relative">
            {/* Logo/Icon */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-neutral-700 to-neutral-800 rounded-2xl mx-auto flex items-center justify-center shadow-lg border border-neutral-700/50">
                <BsChatDots className="w-8 h-8 text-amber-400" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white tracking-tight">Join Room</h1>
                <p className="text-neutral-400 leading-relaxed">Connect with others in real-time conversation</p>
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-300 mb-2">Display Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full p-4 bg-black/50 border border-neutral-700/60 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300 text-base"
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-300 mb-2">Room Code</label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Enter room code"
                  className="w-full p-4 bg-black/50 border border-neutral-700/60 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300 text-base"
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                />
              </div>
              
              <button
                onClick={handleJoinRoom}
                className="w-full bg-gradient-to-r from-amber-600 via-amber-700 to-orange-600 hover:from-amber-500 hover:via-amber-600 hover:to-orange-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl hover:shadow-amber-600/25 active:scale-[0.98] text-base tracking-wide"
              >
                Enter Conversation
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Main Chat Interface
  return (
    <div className="h-screen bg-gradient-to-br from-black via-neutral-900 to-black text-neutral-200 flex flex-col font-sans relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.01),transparent_50%)] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.02),transparent_60%)] pointer-events-none"></div>

      {/* Header */}
      <header className="shrink-0 bg-black/80 backdrop-blur-xl border-b border-neutral-800/50 p-4 lg:p-6 z-20 relative">
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 bg-gradient-to-br from-neutral-700 to-neutral-800 rounded-lg flex items-center justify-center shadow-md border border-neutral-700/50">
                <HiUsers className="w-4 h-4 text-amber-400" />
              </div>
              <h1 className="text-xl lg:text-2xl font-bold text-white truncate tracking-tight">
                {`Room ${currentRoom}`}
              </h1>
            </div>
            <p className="text-sm lg:text-base text-neutral-400 truncate ml-11">
              Chatting as <span className="text-amber-400 font-medium">{currentUser}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-3 lg:gap-4">
            <div className={`flex items-center gap-2.5 px-3 lg:px-4 py-2 rounded-full transition-all duration-300 ${
              isConnected 
                ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {isConnected ? <MdWifi className="w-4 h-4" /> : <MdWifiOff className="w-4 h-4" />}
              <span className="text-sm font-medium hidden sm:inline">{connectionStatus}</span>
             
            </div>
            
            <button 
              onClick={handleLeaveRoom} 
              className="p-2.5 lg:p-3 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 border border-transparent hover:border-red-500/20" 
              title="Leave Room"
            >
              <MdLogout className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-track-neutral-900 scrollbar-thumb-neutral-700">
        <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 max-w-4xl mx-auto pb-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-16 lg:py-24 opacity-60">
              <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-neutral-800 to-black rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-neutral-800/50">
                <BsChatDots className="w-10 h-10 lg:w-12 lg:h-12 text-neutral-600" />
              </div>
              <h3 className="text-xl lg:text-2xl font-semibold text-neutral-300 mb-2">Ready to chat!</h3>
              <p className="text-neutral-500 text-sm lg:text-base leading-relaxed max-w-sm">
                Your conversation starts here. Send a message to break the ice.
              </p>
            </div>
          )}
          
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.type === 'system' ? 'justify-center' : msg.isOwnMessage ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
              {msg.type === 'system' ? (
                <div className="px-4 py-2 bg-neutral-800/60 border border-neutral-700/50 text-neutral-400 text-sm rounded-full backdrop-blur-sm">
                  {msg.content}
                </div>
              ) : (
                <div className={`flex flex-col max-w-[85%] sm:max-w-md lg:max-w-lg ${msg.isOwnMessage ? 'items-end' : 'items-start'}`}>
                  {!msg.isOwnMessage && (
                    <span className="text-xs lg:text-sm font-medium mb-2 px-3 text-amber-400">
                      {msg.sender}
                    </span>
                  )}
                  
                  <div className={`px-4 lg:px-5 py-3 lg:py-4 rounded-2xl shadow-lg backdrop-blur-sm transition-all duration-200 hover:shadow-xl ${
                    msg.isOwnMessage
                      ? 'bg-gradient-to-br from-amber-600 via-amber-700 to-orange-600 text-white rounded-br-md shadow-amber-600/20 hover:shadow-amber-600/30'
                      : 'bg-gradient-to-br from-neutral-800 via-neutral-750 to-neutral-800 text-neutral-100 rounded-bl-md border border-neutral-700/50 shadow-black/20'
                  }`}>
                    <p className="leading-relaxed break-words text-sm lg:text-base font-medium">
                      {msg.content}
                    </p>
                  </div>
                  
                  <span className="text-xs text-neutral-500 mt-2 px-3 font-medium">
                    {msg.timestamp}
                  </span>
                </div>
              )}
            </div>
          ))}
          <div ref={messageEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="shrink-0 bg-black/80 backdrop-blur-xl border-t border-neutral-800/50 p-4 lg:p-6 z-20">
        <div className="flex gap-3 lg:gap-4 items-end max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <input
              type="text"
              ref={inputRef}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="w-full p-4 lg:p-5 bg-neutral-800/50 border border-neutral-700/60 rounded-2xl text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-300 disabled:opacity-50 text-base leading-relaxed pr-12 resize-none"
              onKeyPress={handleKeyPress}
              disabled={!isConnected}
            />
            {isTyping && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!isConnected}
            className={`p-4 lg:p-5 rounded-2xl text-white transform transition-all duration-300 shrink-0 shadow-lg ${
              isConnected
                ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-orange-600 hover:from-amber-500 hover:via-amber-600 hover:to-orange-500 hover:scale-105 active:scale-95 shadow-amber-600/20 hover:shadow-amber-600/30'
                : 'bg-neutral-700 cursor-not-allowed opacity-50'
            }`}
            aria-label="Send message"
          >
            <IoSend className="w-5 h-5" />
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;