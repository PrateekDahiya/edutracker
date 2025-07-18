"use client";
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import logo from '../../../public/logo.png';
import { useSession } from "next-auth/react";

// Types for chat messages and steps
type ChatRole = 'user' | 'assistant' | 'system';
interface ChatMessage {
  role: ChatRole;
  content: string;
}

// Helper to build system prompt for Groq
const today = new Date();
const todayStr = today.toISOString().split('T')[0];

const AIAgent: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [typedMessage, setTypedMessage] = useState<string | null>(null);
  const router = useRouter();
  const chatRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

  // Auto-scroll to bottom on new message or typing
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, typedMessage]);

  // Only normal chat logic
  const sendMessage = async (content: string) => {
    setLoading(true);
    setMessages(messages.concat({ role: 'user', content }));
    setTypedMessage(null);
    setTyping(false);
    // Show 'thinking...' message
    setMessages(prev => [...prev, { role: 'assistant', content: 'EduTrack AI is thinking...' }]);
    try {
      const res = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [
          {
            role: 'system',
            content: `
You are a friendly, helpful AI assistant for the EduTrack education tracker app. Your job is to answer user questions about the app, its features, and how to use it. You do NOT perform any CRUD or backend operations yourself. If a user asks to add, edit, or delete a task, class, or attendance, politely tell them to use the provided buttons above the chat or navigate to the correct page (e.g., 'To add a task, press the Add Task button above or go to the ToDo page').

Always explain things clearly and helpfully, but keep your replies brief and concise. Avoid long paragraphs. Use short sentences or bullet points if helpful. Be clear, friendly, and to the point.

Here is everything you know about the app:

- Dashboard: Overview of your academic progress, quick stats, and recent activity.
- Attendance: View and update your attendance records for each course. You can mark yourself present, absent, or late. Use the 'Update Attendance' button or go to the Attendance tab.
- Schedule: See your weekly class schedule, add or edit classes, and view class details. Use the 'Add Class' button or go to the Schedule tab.
- ToDo: Manage your tasks and assignments. Add, edit, or mark tasks as complete. Use the 'Add Task' button or go to the ToDo tab.
- Activity: See a timeline of your recent actions and updates in the app.
- Profile: View and edit your personal information and avatar.

To access any feature, use the navigation bar at the top of the app or the quick action buttons above this chat. If you need to add a task, class, or attendance, use the appropriate button above.

If a user asks for help, always guide them to the right place and explain how to use the app in a friendly, conversational way.
            `
          },
          ...messages.filter(m => m.role === 'user' || m.role === 'assistant'),
          { role: 'user', content }
        ] }),
      });
      const data = await res.json();
      const aiReply = data.content || "Sorry, I didn't understand that.";
      // Remove 'thinking...' message before typewriter
      setMessages(prev => prev.filter(m => m.content !== 'EduTrack AI is thinking...'));
      setTyping(true);
      setTypedMessage('');
      // Typewriter effect: word by word
      const words = aiReply.split(' ');
      let i = 0;
      function typeNext() {
        setTypedMessage(prev => (prev ? prev + (prev.endsWith(' ') ? '' : ' ') + words[i] : words[i]));
        i++;
        if (i < words.length) {
          setTimeout(typeNext, 40); // adjust speed here
        } else {
          setTyping(false);
          setMessages(prev => [...prev, { role: 'assistant', content: aiReply }]);
          setTypedMessage(null);
        }
      }
      typeNext();
    } catch {
      setMessages(prev => prev.filter(m => m.content !== 'EduTrack AI is thinking...'));
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I didn't understand that. Can you rephrase or try again?" }]);
      setTyping(false);
      setTypedMessage(null);
    }
    setLoading(false);
  };

  // Floating button and widget
  return (
    <>
      {/* Floating Ask AI button */}
      {!open && (
        <button
          className="fixed z-50 bottom-6 right-6 flex items-center gap-2 bg-[var(--primary)] text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl ring-2 ring-transparent focus:ring-[var(--primary)] border border-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--btn-text)] hover:border-[var(--primary)] hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 transition-all duration-200 group cursor-pointer"
          onClick={() => setOpen(true)}
          style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.18)' }}
        >
          <span className="relative w-8 h-8 flex items-center justify-center">
            <Image src={logo} alt="AI" className="w-8 h-8" />
            <span className="absolute -top-1 -right-1 bg-green-500 text-xs text-white rounded-full px-1.5 py-0.5 animate-pulse shadow">●</span>
          </span>
          <span className="font-bold text-base hidden sm:inline">Ask AI</span>
        </button>
      )}
      {/* Floating chat widget */}
      {open && (
        <div className="fixed z-50 bottom-6 right-6 w-[90vw] max-w-sm bg-white dark:bg-[var(--bg-dark)] rounded-2xl shadow-2xl border border-[var(--border)] flex flex-col gap-4 p-4 animate-fade-in transition-all duration-200 hover:scale-[1.03] hover:shadow-2xl group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Image src={logo} alt="AI" className="w-8 h-8" />
              <span className="font-bold text-lg text-[var(--primary)]">EduTrack AI</span>
            </div>
            <button
              className="text-gray-400 hover:text-gray-700 text-2xl font-bold px-2 py-0.5 rounded-full focus:outline-none transition-colors duration-150 cursor-pointer border border-transparent hover:border-[var(--primary)] hover:bg-[var(--primary)]/10 hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 ring-2 ring-transparent focus:ring-[var(--primary)]"
              onClick={() => setOpen(false)}
              aria-label="Close AI chat"
            >
              ×
            </button>
          </div>
          <div className="flex gap-3 justify-center mb-2">
            <button
              className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white font-semibold shadow-lg hover:shadow-xl ring-2 ring-transparent focus:ring-[var(--primary)] border border-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--btn-text)] hover:border-[var(--primary)] hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 transition-all duration-200 cursor-pointer"
              onClick={() => {
                if (!session || !session.user) {
                  alert('Please log in to add a task.');
                  return;
                }
                setOpen(false); router.push('/todo?add=1');
              }}
            >
              Add Task
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white font-semibold shadow-lg hover:shadow-xl ring-2 ring-transparent focus:ring-[var(--primary)] border border-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--btn-text)] hover:border-[var(--primary)] hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 transition-all duration-200 cursor-pointer"
              onClick={() => {
                if (!session || !session.user) {
                  alert('Please log in to add a class.');
                  return;
                }
                setOpen(false); router.push('/schedule?add=1');
              }}
            >
              Add Class
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white font-semibold shadow-lg hover:shadow-xl ring-2 ring-transparent focus:ring-[var(--primary)] border border-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--btn-text)] hover:border-[var(--primary)] hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 transition-all duration-200 cursor-pointer"
              onClick={() => {
                if (!session || !session.user) {
                  alert('Please log in to update attendance.');
                  return;
                }
                setOpen(false); router.push('/attendance?update=1');
              }}
            >
              Update Attendance
            </button>
          </div>
          <div
            ref={chatRef}
            className="flex-1 overflow-y-auto max-h-80 bg-[var(--bg-light)] rounded-lg p-3 scrollbar-none hide-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .blinking-cursor { animation: blink 1s steps(2, start) infinite; } @keyframes blink { to { visibility: hidden; } }`}</style>
            {messages.length === 0 && !typedMessage && (
              <div className="text-center text-gray-400">Say hi or ask me anything about the app!</div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`my-2 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-4 py-2 rounded-2xl max-w-xs ${msg.role === 'user' ? 'bg-[var(--primary)] text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'}`}>{msg.content}</div>
              </div>
            ))}
            {typing && typedMessage !== null && (
              <div className="my-2 flex justify-start">
                <div className="px-4 py-2 rounded-2xl max-w-xs bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 animate-pulse">{typedMessage}<span className="blinking-cursor">|</span></div>
              </div>
            )}
          </div>
          <form
            className="flex gap-2 mt-2"
            onSubmit={e => {
              e.preventDefault();
              if (input.trim()) {
                sendMessage(input.trim());
                setInput('');
              }
            }}
          >
            <input
              className="flex-1 px-4 py-2 rounded-lg border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--bg-light)]"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white font-semibold shadow-lg hover:shadow-xl ring-2 ring-transparent focus:ring-[var(--primary)] border border-[var(--primary)] hover:bg-[var(--primary)] hover:text-[var(--btn-text)] hover:border-[var(--primary)] hover:scale-105 hover:-translate-y-1 focus:scale-105 focus:-translate-y-1 active:scale-95 transition-all duration-200 cursor-pointer"
              disabled={loading || !input.trim()}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default AIAgent;
