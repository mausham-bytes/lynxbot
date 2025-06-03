"use client";
import React, { useState, useRef, useEffect, ChangeEvent } from "react";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Bot,
  User,
  Upload,
  Image,
  Mic,
  Camera,
  Youtube,
  FileImage,
  Send,
  StopCircle,
} from "lucide-react";

interface Message {
  id: number;
  sender: "user" | "ai";
  content: string;
}

const API_KEY = "AIzaSyDz-EAZqfZ_WJVlBZBnNm3odx7Q3vFB9Is";

const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([{
    id: 0,
    sender: "ai",
    content:
      "Hello, I am L.Y.N.K. — the Logical Yielder of Neural Knowledge, at your command.",
  }]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [mediaMenuOpen, setMediaMenuOpen] = useState(false);
  const [lastUserQuestion, setLastUserQuestion] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lynk-chat-history");
      if (saved) {
        const parsed = JSON.parse(saved);
        setMessages(parsed);
        const last = [...parsed].reverse().find((msg) => msg.sender === "user");
        if (last) setLastUserQuestion(last.content);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("lynk-chat-history", JSON.stringify(messages));
    } catch {}
  }, [messages]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const userMessage: Message = {
      id: Date.now(),
      sender: "user",
      content: `📄 ${file.name}`,
    };
    setMessages((prev) => [...prev, userMessage]);
    setLastUserQuestion(file.name);
    e.target.value = "";
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const img = e.target.files?.[0];
    if (!img) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const userMessage: Message = {
          id: Date.now(),
          sender: "user",
          content: reader.result,
        };
        setMessages((prev) => [...prev, userMessage]);
        setLastUserQuestion("[image uploaded]");
      }
    };
    reader.readAsDataURL(img);
    e.target.value = "";
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: "user",
      content: input.trim(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsThinking(true);
    setLastUserQuestion(input.trim());

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const contents = newMessages.map((msg) => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          signal: controller.signal,
          body: JSON.stringify({
            contents,
            generationConfig: {
              responseMimeType: "text/plain",
            },
          }),
        }
      );

      const data = await response.json();
      let aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!aiText && lastUserQuestion) {
        aiText = `🤖 Sorry, I couldn’t generate a response to your last question: "${lastUserQuestion}".`;
      }

      const aiMessage: Message = {
        id: Date.now() + 1,
        sender: "ai",
        content: aiText || "🤖 No valid response received.",
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errMsg = controller.signal.aborted
        ? "❌ Request cancelled."
        : "⚠️ Failed to get AI response. Please try again.";
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 2, sender: "ai", content: errMsg },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const stopRequest = () => {
    abortControllerRef.current?.abort();
    setIsThinking(false);
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isThinking]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0f172a] to-[#020617] p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 15 }}
        className="w-full max-w-3xl h-[85vh] flex flex-col bg-black/60 backdrop-blur-xl rounded-3xl border border-cyan-400/30 shadow-[0_0_30px_5px_rgba(0,255,255,0.3)]"
      >
        <CardContent className="flex flex-col h-full p-6">
          <h1 className="text-4xl font-bold text-center mb-4 text-cyan-300 tracking-widest font-mono drop-shadow-[0_0_10px_rgba(0,255,255,0.9)] border-b border-cyan-500 pb-2">
             L.Y.N.K. 
          </h1>

          <div
            ref={scrollRef}
            className="flex-grow overflow-y-auto pr-2 mb-3 no-scrollbar bg-black/40 rounded-xl p-4"
          >
            <div className="flex flex-col gap-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-end gap-2 ${
                    msg.sender === "user"
                      ? "self-end flex-row-reverse"
                      : "self-start"
                  }`}
                >
                  {msg.content.startsWith("data:image/") ? (
                    <img
                      src={msg.content}
                      alt="User-uploaded"
                      className="max-w-xs md:max-w-sm lg:max-w-md rounded-2xl shadow-lg border border-cyan-400/30"
                    />
                  ) : (
                    <div
                      className={`p-3 rounded-2xl text-sm font-mono max-w-xs md:max-w-sm lg:max-w-md break-words shadow-lg backdrop-blur-md border ${
                        msg.sender === "user"
                          ? "bg-gradient-to-br from-cyan-600 to-blue-500 text-white border-cyan-500/40"
                          : "bg-slate-800/70 text-cyan-200 border-cyan-400/30"
                      }`}
                    >
                      {msg.content}
                    </div>
                  )}
                  <div className="text-cyan-300">
                    {msg.sender === "user" ? (
                      <User className="h-5 w-5" />
                    ) : (
                      <Bot className="h-5 w-5" />
                    )}
                  </div>
                </motion.div>
              ))}

              {isThinking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="text-cyan-400 text-sm italic self-start flex items-center gap-2 ml-1"
                >
                  <Bot className="h-4 w-4 animate-pulse" />
                  <span className="flex space-x-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce delay-150">.</span>
                    <span className="animate-bounce delay-300">.</span>
                  </span>
                  <span className="ml-1">L.Y.N.K. is thinking</span>
                </motion.div>
              )}
            </div>
          </div>

          <div className="mt-auto pt-2">
            <div className="flex items-center justify-between gap-2 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
                placeholder="Type your command, Agent..."
                className="flex-1 rounded-full px-4 py-2 bg-black/40 text-cyan-200 border border-cyan-500 placeholder:text-cyan-400 shadow-[inset_0_0_8px_rgba(0,255,255,0.3)]"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={sendMessage}
                disabled={isThinking}
              >
                <Send className="w-5 h-5 text-cyan-400" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={stopRequest}
                disabled={!isThinking}
              >
                <StopCircle className="w-5 h-5 text-red-400" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMediaMenuOpen((open) => !open)}
              >
                <Upload className="w-5 h-5 text-cyan-400" />
              </Button>

              {mediaMenuOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-black/90 border border-cyan-500/40 rounded-xl shadow-lg space-y-2">
                  <button
                    className="flex items-center gap-2 text-cyan-200 hover:text-cyan-100"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileImage className="w-4 h-4" /> Upload File
                  </button>
                  <button
                    className="flex items-center gap-2 text-cyan-200 hover:text-cyan-100"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <Image className="w-4 h-4" /> Upload Image
                  </button>
                  <button className="flex items-center gap-2 text-cyan-200 hover:text-cyan-100">
                    <Mic className="w-4 h-4" /> Record Audio
                  </button>
                  <button className="flex items-center gap-2 text-cyan-200 hover:text-cyan-100">
                    <Camera className="w-4 h-4" /> Take a photo
                  </button>
                  <button className="flex items-center gap-2 text-cyan-200 hover:text-cyan-100">
                    <Youtube className="w-4 h-4" /> YouTube Video
                  </button>
                  <button className="flex items-center gap-2 text-cyan-200 hover:text-cyan-100">
                    <Upload className="w-4 h-4" /> Sample Media
                  </button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </motion.div>

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileUpload}
      />
      <input
        type="file"
        accept="image/*"
        ref={imageInputRef}
        style={{ display: "none" }}
        onChange={handleImageUpload}
      />
    </div>
  );
};

export default function Home() {
  return <ChatBot />;
};
