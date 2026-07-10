import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Send, Loader2, User, Paperclip, X, ChevronLeft, ChevronRight, Check, CheckCheck } from "lucide-react";
import { ref, onValue, push, serverTimestamp, update } from "firebase/database";
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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [viewerImages, setViewerImages] = useState(null);
  const [viewerIndex, setViewerIndex] = useState(0);

  const textareaRef = useRef(null);
  const imageInputRef = useRef(null);

  const chatId = currentUser && targetUserId 
    ? [currentUser._id, targetUserId].sort().join("_") 
    : null;

  // Manage object URLs for file previews to avoid memory leaks
  useEffect(() => {
    const urls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

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

  // Mark received messages as read
  useEffect(() => {
    if (!messages.length || !currentUser?._id || !chatId) return;

    const unreadMessages = messages.filter(
      (msg) => msg.senderId !== currentUser._id && !msg.isRead
    );

    if (unreadMessages.length > 0) {
      const updates = {};
      unreadMessages.forEach((msg) => {
        updates[`chats/${chatId}/messages/${msg.id}/isRead`] = true;
      });
      update(ref(db), updates).catch((err) => {
        console.error("Error marking messages as read:", err);
      });
    }
  }, [messages, currentUser, chatId]);


  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // Append new files up to 5 max
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (selectedFiles.length + files.length > 5) {
      toast.error("يمكنك اختيار 5 صور كحد أقصى للمرة الواحدة.");
      return;
    }

    setSelectedFiles((prev) => [...prev, ...files]);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  // Handle message sending (including optional image uploading)
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() && selectedFiles.length === 0) return;
    if (!chatId || !currentUser) return;

    let optimizedUrlsArray = [];

    if (selectedFiles.length > 0) {
      setIsUploadingImage(true);
      try {
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_CHAT_PRESET || "chat_media";

        const uploadPromises = selectedFiles.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("upload_preset", uploadPreset);

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
              method: "POST",
              body: formData,
            }
          );

          if (!response.ok) {
            throw new Error("Failed to upload image to Cloudinary");
          }

          const data = await response.json();
          let secureUrl = data.secure_url;
          
          // Optimize Cloudinary URL by inserting f_auto,q_auto,w_800
          if (secureUrl.includes("/upload/")) {
            secureUrl = secureUrl.replace("/upload/", "/upload/f_auto,q_auto,w_800/");
          }
          return secureUrl;
        });

        optimizedUrlsArray = await Promise.all(uploadPromises);
      } catch (err) {
        console.error("Error uploading images:", err);
        toast.error("فشل رفع بعض الصور. يرجى المحاولة مرة أخرى.");
        setIsUploadingImage(false);
        return;
      }
    }

    const messagesRef = ref(db, `chats/${chatId}/messages`);
    const messageData = {
      senderId: currentUser._id,
      timestamp: serverTimestamp(),
      isRead: false,
    };

    if (newMessage.trim()) {
      messageData.text = newMessage.trim();
    }
    
    if (optimizedUrlsArray.length > 0) {
      messageData.images = optimizedUrlsArray;
    }

    try {
      await push(messagesRef, messageData);
      setNewMessage("");
      setSelectedFiles([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = "48px";
      }
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("فشل إرسال الرسالة.");
    } finally {
      setIsUploadingImage(false);
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
      className="h-screen bg-cesar-darker font-cairo flex flex-col text-white overflow-hidden"
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

      {/* Messages area — flex-col-reverse anchors scroll to bottom natively, no JS needed */}
      <main className="flex-1 overflow-y-auto px-4 py-4 max-w-4xl mx-auto w-full flex flex-col-reverse gap-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 opacity-40">
            <div className="h-16 w-16 rounded-2xl border border-cesar-cyan/20 bg-cesar-cyan/10 text-cesar-cyan flex items-center justify-center mb-4">
              <User className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-white">ابدأ المحادثة الآن</h3>
            <p className="text-sm mt-1">أرسل أول رسالة لبدء التواصل مع البائع.</p>
          </div>
        ) : (
          [...messages].reverse().map((msg) => {
            const isMe = msg.senderId === currentUser?._id;
            const hasImages = (msg.images && msg.images.length > 0) || msg.imageUrl;
            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[75%] md:max-w-[80%] mx-4 ${
                  isMe ? "self-end items-end" : "self-start items-start"
                }`}
              >
                <div
                  dir="auto"
                  className={`text-sm rounded-2xl text-start leading-relaxed whitespace-pre-wrap break-words break-all ${
                    isMe
                      ? "bg-cesar-cyan/20 text-cesar-cyan border border-cesar-cyan/30 rounded-br-none"
                      : "bg-white/10 text-white border border-white/5 rounded-bl-none"
                  } ${hasImages && !msg.text ? "p-1" : "px-4 py-2.5"}`}
                >
                  {/* Backwards Compatibility: Single image string */}
                  {msg.imageUrl && !msg.images && (
                    <img
                      src={optimizeImage(msg.imageUrl) || msg.imageUrl}
                      alt="Shared media"
                      className="rounded-xl max-w-sm w-full object-cover cursor-pointer hover:opacity-90 transition mb-1"
                      onClick={() => { setViewerImages([msg.imageUrl]); setViewerIndex(0); }}
                    />
                  )}

                  {/* New: Multi-image grid */}
                  {msg.images && msg.images.length > 0 && (
                    <div
                      className={`grid gap-1 mb-1 max-w-sm ${
                        msg.images.length === 1 ? "grid-cols-1" : "grid-cols-2"
                      }`}
                    >
                      {msg.images.map((imgUrl, i) => (
                        <img
                          key={i}
                          src={optimizeImage(imgUrl) || imgUrl}
                          alt={`Shared media ${i}`}
                          className="rounded-lg w-full aspect-square object-cover cursor-pointer hover:opacity-90 transition"
                          onClick={() => { setViewerImages(msg.images); setViewerIndex(i); }}
                        />
                      ))}
                    </div>
                  )}

                  {msg.text && <p>{msg.text}</p>}
                </div>
                <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-cesar-gray justify-end">
                  <span>{formatTime(msg.timestamp)}</span>
                  {isMe && (
                    msg.isRead ? (
                      <CheckCheck className="h-3.5 w-3.5 text-cesar-cyan shrink-0 animate-pulse" />
                    ) : (
                      <Check className="h-3.5 w-3.5 text-cesar-gray shrink-0" />
                    )
                  )}
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Input area */}
      <footer className="sticky bottom-0 bg-cesar-dark/80 border-t border-white/5 px-4 py-3 backdrop-blur-md">
        {previewUrls.length > 0 && (
          <div className="max-w-4xl mx-auto flex flex-wrap gap-3 mb-3 p-2 bg-black/20 rounded-2xl border border-white/5" dir="rtl">
            {previewUrls.map((url, idx) => (
              <div key={url} className="relative h-16 w-16 group">
                <img
                  src={url}
                  alt="preview"
                  className="h-full w-full object-cover rounded-xl border border-white/10"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
                  }}
                  className="absolute -top-1.5 -left-1.5 h-5 w-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white border border-white/10 shadow-lg transition duration-200"
                  title="حذف"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-3" dir="ltr">
          <input
            type="file"
            multiple
            accept="image/*"
            ref={imageInputRef}
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            type="button"
            disabled={isUploadingImage}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition duration-300 disabled:opacity-50"
            title="إرفاق ملف"
            onClick={() => imageInputRef.current.click()}
          >
            {isUploadingImage ? (
              <Loader2 className="h-5 w-5 animate-spin text-cesar-cyan" />
            ) : (
              <Paperclip className="h-5 w-5" />
            )}
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
            disabled={!newMessage.trim() && selectedFiles.length === 0}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cesar-cyan/30 bg-cesar-cyan/10 text-cesar-cyan hover:bg-cesar-cyan/20 hover:shadow-neon-cyan transition duration-300 disabled:opacity-40 disabled:hover:shadow-none"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </footer>

      {/* Lightbox Modal */}
      {viewerImages && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
          {/* Close Button */}
          <button
            onClick={() => setViewerImages(null)}
            className="absolute top-4 right-4 text-white hover:text-cesar-cyan transition duration-300 z-[110] p-2 rounded-full bg-black/45 border border-white/5"
            title="إغلاق"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Navigation */}
          {viewerImages.length > 1 && (
            <>
              {/* Previous Button (Left) */}
              <button
                onClick={() => setViewerIndex((prev) => (prev === 0 ? viewerImages.length - 1 : prev - 1))}
                className="absolute left-6 text-white hover:text-cesar-cyan hover:shadow-neon-cyan transition duration-300 z-[110] p-3 rounded-full bg-black/55 border border-white/10"
                title="السابق"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              {/* Next Button (Right) */}
              <button
                onClick={() => setViewerIndex((prev) => (prev === viewerImages.length - 1 ? 0 : prev + 1))}
                className="absolute right-6 text-white hover:text-cesar-cyan hover:shadow-neon-cyan transition duration-300 z-[110] p-3 rounded-full bg-black/55 border border-white/10"
                title="التالي"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          {/* Image */}
          <img
            src={viewerImages[viewerIndex]}
            alt={`Viewer Image ${viewerIndex}`}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

export default ChatPage;
