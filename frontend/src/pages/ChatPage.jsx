import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Send, Loader2, User, Paperclip } from "lucide-react";
import { ref, onValue, push, serverTimestamp } from "firebase/database";
import { toast } from "react-toastify";
import { db } from "../Services/firebase";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../Services/api.js";
import { optimizeImage } from "../utils/imageOptimizer.js";

const ChatPage = () => {
  const { id: targetUserId } = useParams();
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const currentUser = user?.name ? user : user?.user;
  const navigate = useNavigate();

  const [targetUser, setTargetUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const chatId = currentUser && targetUserId 
    ? [currentUser._id, targetUserId].sort().join("_") 
    : null;

  // Fetch target user info
  useEffect(() => {
    if (!targetUserId) return;
    let isMounted = true;
    const fetchTargetUser = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/users/${targetUserId}`);
        if (isMounted) {
          setTargetUser(response.data);
        }
      } catch (err) {
        console.error("Error fetching target user:", err);
        if (isMounted) {
          setError("تعذر تحميل بيانات البائع.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchTargetUser();
    return () => {
      isMounted = false;
    };
  }, [targetUserId]);

  // Read/Subscribe to Firebase messages
  useEffect(() => {
    if (!chatId) return;

    const messagesRef = ref(db, `chats/${chatId}/messages`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert object of objects to array
        const messageList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        // Sort by timestamp
        messageList.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        setMessages(messageList);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [chatId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Handle message sending
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !chatId || !currentUser) return;

    const messagesRef = ref(db, `chats/${chatId}/messages`);
    const messageData = {
      senderId: currentUser._id,
      text: newMessage.trim(),
      timestamp: serverTimestamp(),
    };

    try {
      await push(messagesRef, messageData);
      setNewMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "48px";
      }
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("فشل إرسال الرسالة.");
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString(i18n.language === "ar" ? "ar-EG" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cesar-darker font-cairo flex items-center justify-center text-white">
        <div className="flex items-center gap-3 text-cesar-cyan">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm font-medium">جارٍ تحميل المحادثة...</span>
        </div>
      </div>
    );
  }

  if (error || !targetUser) {
    return (
      <div className="min-h-screen bg-cesar-darker font-cairo flex flex-col items-center justify-center text-white p-4">
        <p className="text-red-500 mb-4">{error || "البائع غير موجود"}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-cesar-cyan hover:underline"
        >
          العودة
        </button>
      </div>
    );
  }

  return (
    <div
      dir={i18n.dir()}
      className="min-h-screen bg-cesar-darker font-cairo flex flex-col text-white"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/5 bg-cesar-dark/85 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/5 bg-black/35 hover:bg-white/5 transition duration-300"
            title="رجوع"
          >
            <ArrowRight className={`h-5 w-5 ${i18n.dir() === "rtl" ? "" : "rotate-180"}`} />
          </button>
          <div className="flex items-center gap-3">
            {targetUser.profilePictureUrl ? (
              <img
                src={optimizeImage(targetUser.profilePictureUrl)}
                alt={targetUser.name}
                className="h-10 w-10 rounded-full object-cover border border-cesar-cyan/20"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cesar-cyan/10 border border-cesar-cyan/20 text-cesar-cyan">
                <User className="h-5 w-5" />
              </div>
            )}
            <div>
              <h2 className="text-base font-bold leading-tight">{targetUser.name}</h2>
              <span className="text-xs text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                تواصل مباشر
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Messages area */}
      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-24 space-y-4 max-w-4xl mx-auto w-full flex flex-col justify-end">
        <div className="space-y-4 flex-grow flex flex-col justify-end">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-40">
              <div className="h-16 w-16 rounded-2xl border border-cesar-cyan/20 bg-cesar-cyan/10 text-cesar-cyan flex items-center justify-center mb-4">
                <User className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-white">ابدأ المحادثة الآن</h3>
              <p className="text-sm mt-1">أرسل أول رسالة لبدء التواصل مع البائع.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUser?._id;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[75%] md:max-w-[80%] mx-4 my-1.5 ${
                    isMe ? "self-end items-end" : "self-start items-start"
                  }`}
                >
                  <div
                    dir="auto"
                    className={`px-4 py-2.5 text-sm rounded-2xl text-start leading-relaxed whitespace-pre-wrap break-words break-all ${
                      isMe
                        ? "bg-cesar-cyan/20 text-cesar-cyan border border-cesar-cyan/30 rounded-br-none"
                        : "bg-white/10 text-white border border-white/5 rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-cesar-gray mt-1 px-1">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input area */}
      <footer className="sticky bottom-0 bg-cesar-dark/80 border-t border-white/5 px-4 py-3 backdrop-blur-md">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-3" dir="ltr">
          <button
            type="button"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition duration-300"
            title="إرفاق ملف"
            onClick={() => toast.info("ميزة إرفاق الملفات ستتوفر قريباً!")}
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <textarea
            ref={textareaRef}
            rows="1"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              if (textareaRef.current) {
                textareaRef.current.style.height = "48px";
                const scrollHeight = textareaRef.current.scrollHeight;
                textareaRef.current.style.height = `${Math.min(Math.max(48, scrollHeight), 160)}px`;
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="اكتب رسالة..."
            className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:border-cesar-cyan focus:ring-1 focus:ring-cesar-cyan outline-none transition duration-300 placeholder:text-slate-500 text-start resize-none h-12 overflow-y-auto"
            style={{ scrollbarWidth: "none" }}
            dir="auto"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cesar-cyan/30 bg-cesar-cyan/10 text-cesar-cyan hover:bg-cesar-cyan/20 hover:shadow-neon-cyan transition duration-300 disabled:opacity-40 disabled:hover:shadow-none"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatPage;
