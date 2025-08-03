import { useEffect, useRef, useState } from "react"

const App = () => {

  const [message, setMessage] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("disconnected")

  const [userName, setUserName] = useState("")
  const [roomId, setRoomId] = useState("")
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false)
  const [currentRoom, setCurrentRoom] = useState("")
  const [currentUser, setCurrentUser] = useState("")


  const wsRef = useRef()
  const inputRef = useRef()
  const messageEndRef = useRef()
  

  useEffect(()=>{
    if(!hasJoinedRoom) return;

    const ws = new WebSocket("ws://localhost:8080")

    ws.onopen = () => {
      console.log("Connected to backend");

      setIsConnected(true)
      setConnectionStatus("connected")

      ws.send(JSON.stringify({
        type: "join",
        payload: {
          roomId: currentRoom,
          userName: currentUser
        }
      }))
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if(data.type === "system"){
          //@ts-ignore
          setMessage(m => [...m, {
            type: "system",
            content: data.message,
            timeStamp: new Date().toLocaleDateString()
          }])
        }else if( data.type === "chat"){
          //@ts-ignore
          setMessage(m => [...m , {
            type: "chat",
            sender: data.sender,
            content: data.message,
            timeStamp: new Date().toLocaleDateString(),
            isOwnMessage: data.sender === currentUser
          }])
        }
      } catch (error) {
          // If not JSON, treat as plain text message (backward compatibility)
          //@ts-ignore
        setMessage(m => [...m, {
          type: "chat",
          sender: "Unknown",
          content: event.data,
          timestamp: new Date().toLocaleTimeString(),
          isOwnMessage: false
        }])
      }
    }

    ws.onclose = () => {
      console.log("WebSocket connection closed")
      setIsConnected(false)
      setConnectionStatus("disconnected")
    }

    ws.onerror = (error) => {
      console.log("Websocket error: ", error);
      
      setConnectionStatus("Error")
    }

    wsRef.current = ws

    return () =>{
      if(ws.readyState === WebSocket.OPEN){
        //@ts-ignore
        ws.onclose()
      }
    }

  }, [hasJoinedRoom, currentRoom, currentUser])


  const handleJoinRoom = () => {
    if (!userName.trim() || !roomId.trim()) {
      alert("Please enter both your name and room ID")
      return
    }
    
    setCurrentUser(userName.trim())
    setCurrentRoom(roomId.trim())
    setHasJoinedRoom(true)
    setMessage([]) // Clear any previous messages
  }


  const handleSendMessage = () => {
    //@ts-ignore
    const message = inputRef.current?.value?.trim()
    //@ts-ignore
    if(!message || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    //@ts-ignore
    wsRef.current.send(JSON.stringify({
      type: "chat",
      payload: {
        message: message,
        sender: currentUser
      }
    }))

    // Clear input
    //@ts-ignore
    inputRef.current.value = ""
  }

  const handleKeyPress = (e) => {
    if(e.key === "Enter"){
      handleSendMessage()
    }
  }

  const handleLeaveRoom = () => {
    //@ts-ignore
    if(wsRef.current && wsRef.current.readyState === WebSocket.OPEN){
      //@ts-ignore
      wsRef.current.close()
    }

    setHasJoinedRoom(false)
    setMessage([])
    setCurrentRoom("")
    setCurrentUser("")
    setUserName("")
    setRoomId("")
  }

 if(!hasJoinedRoom){

     return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/20 w-full max-w-md">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">Join Chat Room</h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">Your Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full p-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
              />
            </div>
            
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">Room ID</label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter or create room ID"
                className="w-full p-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
              />
            </div>
            
            <button
              onClick={handleJoinRoom}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              Join Room
            </button>
          </div>
          
          <p className="text-white/60 text-sm text-center mt-4">
            Enter the same Room ID as your friends to chat together!
          </p>
        </div>
      </div>
    )
  
 } 
  
  
   return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white">Room: {currentRoom}</h1>
            <p className="text-white/70 text-sm">Logged in as: {currentUser}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-white/80 text-sm">{connectionStatus}</span>
            </div>
            <button
              onClick={handleLeaveRoom}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Leave Room
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {message.length === 0 ? (
          <div className="text-center text-white/60 mt-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          message.map((msg, index) => (
            //@ts-ignore
            <div key={index} className={`flex ${msg.type === 'system' ? 'justify-center' : msg.isOwnMessage ? 'justify-end' : 'justify-start'}`}>
          
              {msg.type === 'system' ? (
                <div className="bg-white/20 text-white/80 px-4 py-2 rounded-full text-sm">
                  
                  {msg.content}
                </div>
              ) : (
                <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  //@ts-ignore
                  msg.isOwnMessage 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                    : 'bg-white/20 text-white'
                }`}>
                  
                  {!msg.isOwnMessage && (
                    //@ts-ignore
                    <p className="text-xs font-semibold mb-1 text-white/80">{msg.sender}</p>
                  )}
                  
                  <p className="break-words">{msg.content}</p>
                  
                  <p className="text-xs mt-1 opacity-70">{msg.timestamp}</p>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messageEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white/10 backdrop-blur-md border-t border-white/20 p-4">
        <div className="flex gap-3 items-center">
          <input
            type="text"
            ref={inputRef}
            placeholder="Type your message..."
            className="flex-1 p-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
            onKeyPress={handleKeyPress}
            disabled={!isConnected}
          />
          <button
            onClick={handleSendMessage}
            disabled={!isConnected}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 text-white px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
  
}

export default App
