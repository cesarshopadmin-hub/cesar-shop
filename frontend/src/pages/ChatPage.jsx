import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Send, Loader2, User, Paperclip, X, ChevronLeft, ChevronRight, Check, CheckCheck, ShieldAlert, SmilePlus } from "lucide-react";
import { ref, onValue, push, serverTimestamp, update, set, remove, query, limitToLast, get } from "firebase/database";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { db } from "../Services/firebase";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../Services/api.js";
import { optimizeImage } from "../utils/imageOptimizer.js";

const reactEmojis = { like: '👍', love: '❤️', fire: '🔥', laugh: '😂', wow: '😮' };

const ChatPage = () => {
  const { id: targetId } = useParams();
  const targetUserId = targetId;
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const currentUser = user?.name ? user : user?.user;
  const navigate = useNavigate();
  const adminId = import.meta.env.VITE_ADMIN_ID;

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
  const [participants, setParticipants] = useState([]);

  // Reactions state
  const [activeReactMenu, setActiveReactMenu] = useState(null);
  const [reactDetailsModal, setReactDetailsModal] = useState(null);
  const [showMediationModal, setShowMediationModal] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);

  const textareaRef = useRef(null);
  const imageInputRef = useRef(null);

  const [chatId, setChatId] = useState(null);

  // Initialize Chat ID
  useEffect(() => {
    if (!targetId || !currentUser?._id) return;

    if (targetId.includes("_")) {
      setChatId(targetId);
    } else {
      const directId = [currentUser._id, targetId].sort().join("_");
      setChatId(directId);
    }
  }, [targetId, currentUser?._id]);

  const isMediationRoom = targetId && targetId.includes("_");

  const [mediatorUsers, setMediatorUsers] = useState([]);

  // Manage object URLs for file previews to avoid memory leaks
  useEffect(() => {
    const urls = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  // Fetch mediated users info (for mediation rooms)
  useEffect(() => {
    if (!isMediationRoom || !targetUserId) return;
    let isMounted = true;
    const fetchMediatedUsers = async () => {
      try {
        setLoading(true);
        const parts = targetUserId.split("_");
        const users = await Promise.all(
          parts.map((id) =>
            api.get(`/users/${id}`)
              .then((res) => res.data)
              .catch(() => ({ name: i18n.language === "ar" ? "مستخدم" : "User" }))
          )
        );
        if (isMounted) {
          setMediatorUsers(users);
        }
      } catch (err) {
        console.error("Error fetching mediated users:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchMediatedUsers();
    return () => {
      isMounted = false;
    };
  }, [targetUserId, isMediationRoom, i18n.language]);

  // Fetch target user info (for direct chats only)
  useEffect(() => {
    if (!targetUserId || isMediationRoom) return;
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
  }, [targetUserId, isMediationRoom]);

  // Read/Subscribe to Firebase messages
  useEffect(() => {
    if (!chatId) return;

    const messagesQuery = query(ref(db, `chats/${chatId}/messages`), limitToLast(50));
    const unsubscribe = onValue(messagesQuery, (snapshot) => {
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
      (msg) => msg.senderId !== currentUser._id && !(msg.readBy && msg.readBy[currentUser._id])
    );

    if (unreadMessages.length > 0) {
      const updates = {};
      unreadMessages.forEach((msg) => {
        updates[`chats/${chatId}/messages/${msg.id}/readBy/${currentUser._id}`] = true;
      });
      update(ref(db), updates).catch((err) => {
        console.error("Error marking messages as read:", err);
      });
    }
  }, [messages, currentUser, chatId]);

  const handleMessageReact = async (msgId, currentReacts, reactType) => {
    if (!currentUser?._id || !chatId) return;
    const userCurrentReact = currentReacts?.[currentUser._id];

    try {
      if (userCurrentReact === reactType) {
        await remove(ref(db, `chats/${chatId}/messages/${msgId}/reacts/${currentUser._id}`));
      } else {
        await set(ref(db, `chats/${chatId}/messages/${msgId}/reacts/${currentUser._id}`), reactType);
      }
      setActiveReactMenu(null);
    } catch (err) {
      console.error("Error setting message reaction:", err);
      toast.error(i18n.language === "ar" ? "تعذر تسجيل التفاعل" : "Failed to record reaction");
    }
  };

  // Subscribe to participants list
  useEffect(() => {
    if (!chatId) return;

    const participantsRef = ref(db, `chats/${chatId}/participants`);
    const unsubscribe = onValue(participantsRef, (snapshot) => {
      const data = snapshot.val();
      if (Array.isArray(data)) {
        setParticipants(data);
      } else {
        setParticipants([]);
      }
    });

    return () => unsubscribe();
  }, [chatId]);

  const isMediationVisible = 
    currentUser?._id &&
    targetUserId &&
    currentUser._id !== adminId &&
    targetUserId !== adminId &&
    !participants.includes(adminId);

  const handleRequestMediation = () => {
    setShowMediationModal(true);
  };

  const confirmMediation = async () => {
    const parts = chatId.split("_");
    if (parts.length < 2) return;

    const userAId = parts[0];
    const userBId = parts[1];

    const updatedParticipants = Array.from(
      new Set([userAId, userBId, adminId])
    );

    const messagesRef = ref(db, `chats/${chatId}/messages`);
    const newMsgRef = push(messagesRef);

    const updates = {};
    updates[`chats/${chatId}/participants`] = updatedParticipants;
    updates[`chats/${chatId}/isMediated`] = true;
    
    updatedParticipants.forEach((pId) => {
      updates[`userChats/${pId}/${chatId}`] = true;
    });
    updates[`chats/${chatId}/messages/${newMsgRef.key}`] = {
      senderId: "system",
      text: "تم طلب تدخل الإدارة. سينضم إليكم أحد المشرفين قريباً للوساطة.",
      timestamp: serverTimestamp(),
      readBy: {
        [currentUser._id]: true
      }
    };

    try {
      await update(ref(db), updates);
      toast.success("تم إبلاغ الإدارة بنجاح");
      setShowMediationModal(false);
    } catch (err) {
      console.error("Error requesting admin mediation:", err);
      toast.error("حدث خطأ أثناء إرسال طلب تدخل الإدارة.");
    }
  };


  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isCooldown) {
        handleSendMessage(e);
      }
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
    if (isCooldown) return;
    if (!newMessage.trim() && selectedFiles.length === 0) return;
    if (!chatId || !currentUser) return;

    let todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format (local time)
    let currentUploadCount = 0;

    if (selectedFiles.length > 0) {
      setIsUploadingImage(true);
      try {
        const limitRef = ref(db, `user_limits/${currentUser._id}/daily_images`);
        const limitSnapshot = await get(limitRef);
        const limitData = limitSnapshot.val();

        if (limitData && limitData.date === todayStr) {
          currentUploadCount = limitData.count || 0;
        }

        if (currentUploadCount + selectedFiles.length > 20) {
          toast.error("لقد وصلت للحد الأقصى لرفع الصور اليوم (20 صورة).");
          setIsUploadingImage(false);
          return;
        }
      } catch (err) {
        console.error("Error checking image upload limits:", err);
      }
    }

    let optimizedUrlsArray = [];

    if (selectedFiles.length > 0) {
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
      readBy: {
        [currentUser._id]: true
      }
    };

    if (newMessage.trim()) {
      messageData.text = newMessage.trim();
    }
    
    if (optimizedUrlsArray.length > 0) {
      messageData.images = optimizedUrlsArray;
    }

    const newMsgKey = push(messagesRef).key;
    const updates = {};
    updates[`chats/${chatId}/messages/${newMsgKey}`] = messageData;

    if (isMediationRoom) {
      participants.forEach((pId) => {
        updates[`userChats/${pId}/${chatId}`] = true;
      });
    } else {
      updates[`userChats/${currentUser._id}/${chatId}`] = true;
      updates[`userChats/${targetUserId}/${chatId}`] = true;
    }

    if (selectedFiles.length > 0) {
      updates[`user_limits/${currentUser._id}/daily_images`] = {
        date: todayStr,
        count: currentUploadCount + selectedFiles.length
      };
    }

    try {
      setIsCooldown(true);
      setTimeout(() => {
        setIsCooldown(false);
      }, 1000);

      await update(ref(db), updates);
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

  const getSenderName = (senderId) => {
    if (senderId === "system") return "";
    if (senderId === adminId) return i18n.language === "ar" ? "الإدارة" : "Admin";
    if (targetUser && senderId === targetUser._id) return targetUser.name;

    const foundUser = mediatorUsers.find((u) => u._id === senderId);
    return foundUser?.name || (i18n.language === "ar" ? "مستخدم" : "User");
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

  if (error || (!targetUser && !isMediationRoom)) {
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
            {isMediationRoom ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">
                <ShieldAlert className="h-5 w-5 animate-pulse" />
              </div>
            ) : targetUser.profilePictureUrl ? (
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
              <h2 className="text-base font-bold leading-tight">
                {isMediationRoom 
                  ? `وساطة: ${mediatorUsers[0]?.name || ""} و ${mediatorUsers[1]?.name || ""}` 
                  : targetUser.name}
              </h2>
              <span className="text-xs flex items-center gap-1.5 mt-0.5 font-bold font-cairo text-emerald-400">
                {isMediationRoom ? (
                  <span className="text-yellow-500">غرفة النزاع والوساطة</span>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    تواصل مباشر
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Request Mediation Button */}
        {isMediationVisible && (
          <button
            type="button"
            onClick={handleRequestMediation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-yellow-500/50 text-yellow-500 bg-transparent hover:bg-yellow-500/10 transition font-bold font-cairo text-xs select-none"
          >
            <ShieldAlert className="h-4 w-4 animate-pulse text-yellow-500" />
            <span>تدخل الإدارة</span>
          </button>
        )}
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
            if (msg.senderId === "system") {
              return (
                <div key={msg.id} className="self-center my-3 mx-auto max-w-[90%] md:max-w-[70%] text-center">
                  <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300/95 text-xs px-4 py-2 rounded-xl font-medium inline-block shadow-sm">
                    {msg.text}
                  </div>
                </div>
              );
            }

            const isMe = msg.senderId === currentUser?._id;
            const hasImages = (msg.images && msg.images.length > 0) || msg.imageUrl;
            
            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[75%] md:max-w-[80%] mx-4 group relative ${
                  isMe ? "self-end items-end" : "self-start items-start"
                }`}
              >
                {activeReactMenu === msg.id && (
                  <div 
                    className="fixed inset-0 z-50 cursor-default"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveReactMenu(null);
                    }}
                  />
                )}

                <AnimatePresence>
                  {activeReactMenu === msg.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.8 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.8 }}
                      className={`absolute bottom-full mb-1 z-[60] flex gap-2.5 bg-cesar-darker border border-white/10 rounded-full px-3 py-1.5 shadow-2xl w-max ${isMe ? "left-0 origin-bottom-left" : "right-0 origin-bottom-right"}`}
                    >
                      {Object.entries(reactEmojis).map(([type, emoji]) => {
                        const isSelected = msg.reacts?.[currentUser?._id] === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMessageReact(msg.id, msg.reacts, type);
                            }}
                            className={`hover:scale-125 transition duration-150 text-xl shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${isSelected ? "bg-white/20 scale-110" : ""}`}
                            title={type}
                          >
                            {emoji}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>

                {!isMe && isMediationRoom && (
                  <span className="text-[10px] font-bold text-cesar-cyan mb-0.5 px-1 font-cairo select-none">
                    {getSenderName(msg.senderId)}
                  </span>
                )}
                <div
                  dir="auto"
                  className={`text-sm rounded-2xl text-start leading-relaxed whitespace-pre-wrap break-words break-all relative ${
                    isMe
                      ? "bg-cesar-cyan/20 text-cesar-cyan border border-cesar-cyan/30 rounded-br-none"
                      : "bg-white/10 text-white border border-white/5 rounded-bl-none"
                  } ${hasImages && !msg.text ? "p-1" : "px-4 py-2.5"}`}
                >
                  {msg.imageUrl && !msg.images && (
                    <img
                      src={optimizeImage(msg.imageUrl) || msg.imageUrl}
                      alt="Shared media"
                      className="rounded-xl max-w-sm w-full object-cover cursor-pointer hover:opacity-90 transition mb-1"
                      onClick={() => { setViewerImages([msg.imageUrl]); setViewerIndex(0); }}
                    />
                  )}

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

                  {/* Reactions Display Badge */}
                  {(() => {
                    const reactsArray = Object.values(msg.reacts || {});
                    const totalReacts = reactsArray.length;
                    if (totalReacts === 0) return null;
                    const uniqueEmojis = Array.from(new Set(reactsArray)).map(r => reactEmojis[r]);
                    return (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReactDetailsModal(msg.id);
                        }}
                        className={`absolute -bottom-2.5 flex items-center gap-0.5 bg-cesar-darker border border-white/10 rounded-full px-1.5 py-0.5 text-[9px] shadow-sm z-10 cursor-pointer hover:bg-white/5 transition ${isMe ? "left-2" : "right-2"}`}
                      >
                        <span className="flex items-center gap-0.5 select-none">
                          {uniqueEmojis.slice(0, 3).map((emoji, i) => (
                            <span key={i}>{emoji}</span>
                          ))}
                        </span>
                        <span className="text-cesar-cyan font-bold mr-0.5">{totalReacts}</span>
                      </button>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-cesar-gray justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveReactMenu(activeReactMenu === msg.id ? null : msg.id)}
                    className="transition text-cesar-gray hover:text-cesar-cyan p-0.5 mr-1"
                    title={i18n.language === "ar" ? "تفاعل" : "React"}
                  >
                    <SmilePlus className="h-3.5 w-3.5" />
                  </button>
                  <span>{formatTime(msg.timestamp)}</span>
                  {isMe && (() => {
                    const readCount = msg.readBy ? Object.keys(msg.readBy).filter(id => id !== currentUser?._id).length : 0;
                    
                    let isReadByAll = false;
                    if (isMediationRoom) {
                      isReadByAll = participants.length > 1 ? readCount >= participants.length - 1 : false;
                    } else {
                      isReadByAll = readCount > 0;
                    }
                    
                    if (isReadByAll) {
                      return <CheckCheck className="h-3.5 w-3.5 text-cesar-cyan shrink-0 animate-pulse" />;
                    } else if (readCount > 0) {
                      return <CheckCheck className="h-3.5 w-3.5 text-cesar-gray shrink-0" />;
                    } else {
                      return <Check className="h-3.5 w-3.5 text-cesar-gray shrink-0" />;
                    }
                  })()}
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
            disabled={(!newMessage.trim() && selectedFiles.length === 0) || isCooldown}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition duration-300 ${
              isCooldown 
                ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-500" 
                : "border-cesar-cyan/30 bg-cesar-cyan/10 text-cesar-cyan hover:bg-cesar-cyan/20 hover:shadow-neon-cyan"
            } disabled:opacity-40 disabled:hover:shadow-none`}
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
      {/* Mediation Confirmation Modal */}
      {showMediationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/5 bg-cesar-dark/95 p-6 text-center shadow-2xl">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-500">
                <ShieldAlert className="h-6 w-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white font-cairo">طلب تدخل الإدارة</h3>
              <p className="text-sm text-cesar-gray leading-relaxed font-cairo">
                هل أنت متأكد من طلب تدخل الإدارة في هذه المحادثة؟ سيقوم أحد المشرفين بالانضمام قريباً للمساعدة والوساطة.
              </p>
              <div className="flex gap-3 w-full mt-2 font-cairo">
                <button
                  type="button"
                  onClick={confirmMediation}
                  className="flex-1 py-3 rounded-xl border border-yellow-500/50 text-yellow-500 bg-transparent hover:bg-yellow-500/10 text-sm font-bold transition duration-200"
                >
                  تأكيد
                </button>
                <button
                  type="button"
                  onClick={() => setShowMediationModal(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-cesar-gray hover:text-white text-sm font-bold transition duration-200"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Reaction Details Modal */}
      <AnimatePresence>
        {reactDetailsModal && (() => {
          const targetMsg = messages.find(m => m.id === reactDetailsModal);
          if (!targetMsg) return null;

          const reactsEntries = Object.entries(targetMsg.reacts || {});

          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setReactDetailsModal(null)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-xs overflow-hidden rounded-[2rem] border border-white/10 bg-cesar-dark p-6 shadow-2xl text-right"
              >
                <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-3">
                  <button
                    onClick={() => setReactDetailsModal(null)}
                    className="rounded-xl p-1 bg-white/5 text-cesar-gray hover:text-white transition"
                  >
                    <X className="h-5 w-5"/>
                  </button>
                  <h3 className="text-lg font-bold text-white font-cairo">
                    {i18n.language === "ar" ? "التفاعلات" : "Reactions"}
                  </h3>
                </div>

                <div className="space-y-4 max-h-60 overflow-y-auto pr-1" style={{ scrollbarWidth: 'none' }}>
                  {reactsEntries.map(([userId, reactType]) => {
                    const isMe = userId === currentUser?._id;
                    const displayName = isMe ? (i18n.language === "ar" ? "أنت" : "You") : getSenderName(userId);
                    
                    let userImage = "";
                    if (userId === adminId) {
                      userImage = "/favicon.png";
                    } else if (isMe) {
                      userImage = currentUser?.profilePictureUrl;
                    } else if (userId === targetUser?._id) {
                      userImage = targetUser?.profilePictureUrl;
                    } else {
                      const mUser = mediatorUsers.find(u => u._id === userId);
                      if (mUser) userImage = mUser.profilePictureUrl;
                    }

                    return (
                      <div key={userId} className="flex items-center justify-between font-cairo">
                        <div className="flex items-center gap-3">
                          {userImage ? (
                            <img
                              src={userId === adminId ? userImage : optimizeImage(userImage)}
                              alt={displayName}
                              className="h-10 w-10 rounded-full object-cover border border-white/10 bg-cesar-darker/50 p-1"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10 text-cesar-gray">
                              <User className="h-5 w-5"/>
                            </div>
                          )}
                          <span className="text-sm font-bold text-slate-200">{displayName}</span>
                        </div>
                        <span className="text-2xl">{reactEmojis[reactType]}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

export default ChatPage;
