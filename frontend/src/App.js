import React, { useState, useEffect, useRef, memo } from 'react';

// --- Icons ---
const SendIcon = memo(() => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
    <path d="M22 2L11 13" />
    <path d="M22 2L15 22L11 13L2 9L22 2Z" />
  </svg>
));

const BotIcon = memo(() => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8
    8 3.59 8 8-3.59 8-8 8zM8 12.5c0 .83.67 1.5 1.5 1.5S11 13.33 11 12.5s-.67-1.5-1.5-1.5S8 11.67 8 12.5zm5
    0c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5-1.5.67-1.5 1.5z"/>
  </svg>
));

const UserIcon = memo(() => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 
    1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 
    1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
));

// --- Extract video ID helper ---
const extractVideoId = (url) => {
  const match = url.match(
    /(?:https?:\/\/)?(?:www\.)?youtu(?:\.be|be\.com)\/(?:watch\?v=)?([\w-]{11})/
  );
  return match ? match[1] : null;
};

// --- VideoInput Component ---
const VideoInput = ({ onUrlSubmit, isLoading }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onUrlSubmit(url);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
          Marcus AI
        </h1>
        <p className="text-gray-600 mt-4 text-lg">
          Chat with YouTube Videos.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a YouTube video link here to start asking questions"
          className="w-full px-5 py-4 text-lg text-gray-700 bg-white/80 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="w-full flex items-center justify-center px-5 py-4 text-lg font-semibold text-white bg-blue-600 rounded-xl shadow-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-105"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2
                5.291A7.962 7.962 0 014 12H0c0 3.042 1.135
                5.824 3 7.938l3-2.647z"></path>
              </svg>
              Fetching Transcript...
            </>
          ) : (
            'Start Chatting'
          )}
        </button>
      </form>
    </div>
  );
};

// --- Message Component ---
const Message = ({ message }) => {
  const isBot = message.sender === 'bot';
  return (
    <div className={`flex items-start gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}>
      {isBot && <BotIcon />}
      <div className={`max-w-md p-4 rounded-2xl shadow-sm ${
        isBot
          ? 'bg-gray-100 text-gray-800 rounded-bl-none'
          : 'bg-blue-600 text-white rounded-br-none'
      }`}>
        <p className="text-base">{message.text}</p>
      </div>
      {!isBot && <UserIcon />}
    </div>
  );
};

// --- ChatWindow Component ---
const ChatWindow = ({ messages, onSendMessage, isLoading, onGoBack }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/20">
        <button onClick={onGoBack} className="text-blue-600 hover:underline font-medium">
          &larr; Use another video
        </button>
        <h2 className="text-xl font-bold text-gray-800">Marcus AI</h2>
      </div>
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex items-start gap-3 justify-start">
            <BotIcon />
            <div className="max-w-md p-4 rounded-2xl bg-gray-100 text-gray-800 rounded-bl-none">
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-white/20">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about the video..."
            className="flex-1 px-4 py-3 text-base text-gray-700 bg-white/80 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 bg-blue-600 rounded-full shadow-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
            aria-label="Send message"
          >
            <SendIcon />
          </button>
        </form>
      </div>
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [view, setView] = useState('videoInput');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);

  const handleUrlSubmit = async (url) => {
    const videoId = extractVideoId(url);
    if (!videoId) {
      setError("Invalid YouTube URL.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setYoutubeUrl(url);

    try {
      const res = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_id: videoId,
          query: "Give an overview of the video",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to fetch transcript");

      setMessages([
        {
          id: Date.now(),
          text: data.response,
          sender: "bot",
        },
      ]);
      setView("chat");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (text) => {
    const userMessage = { id: Date.now(), text, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const videoId = extractVideoId(youtubeUrl);
      const res = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ video_id: videoId, query: text }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error generating response");

      const botResponse = {
        id: Date.now() + 1,
        text: data.response,
        sender: "bot",
      };
      setMessages((prev) => [...prev, botResponse]);
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 1,
        text: `Error: ${err.message}`,
        sender: "bot",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    setView('videoInput');
    setYoutubeUrl('');
    setMessages([]);
    setError(null);
  };

  return (
    <>
      <style>
        {`
          @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
          .animation-delay-2000 { animation-delay: 2s; }
          .animation-delay-4000 { animation-delay: 4s; }
        `}
      </style>
      <div className="font-sans bg-gray-50">
        <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>

          <main className="relative z-10 w-full max-w-2xl h-[85vh] bg-white/50 backdrop-blur-lg border border-white/30 rounded-3xl shadow-2xl shadow-gray-300/50 flex flex-col transition-all duration-500 ease-in-out">
            {error && (
              <div className="p-4 m-4 text-center text-red-700 bg-red-100 border border-red-400 rounded-lg">
                <p><strong>Error:</strong> {error}</p>
              </div>
            )}
            {view === 'videoInput' ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <VideoInput onUrlSubmit={handleUrlSubmit} isLoading={isLoading} />
              </div>
            ) : (
              <ChatWindow
                messages={messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                onGoBack={handleGoBack}
              />
            )}
          </main>
        </div>
      </div>
    </>
  );
}
