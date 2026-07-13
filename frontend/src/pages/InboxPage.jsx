import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MessageSquare, Loader2, User, ShieldAlert } from "lucide-react";
import { ref, onValue } from "firebase/database";
import { db } from "../Services/firebase";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../Services/api.js";
import { optimizeImage } from "../utils/imageOptimizer.js";

const InboxPage = () => {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const currentUser = user?.name ? user : user?.user;

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInitialFetchDone, setIsInitialFetchDone] = useState(false);
  const usersCacheRef = useRef({});

  const [userChatsKeys, setUserChatsKeys] = useState([]);
  const [chatsData, setChatsData] = useState({});
  const activeListenersRef = useRef({});

  // 1. Listen to userChats to get the chat IDs the user is involved in
  useEffect(() => {
    if (!currentUser?._id) {
      setLoading(false);
      setIsInitialFetchDone(true);
      return;
    }

    const userChatsRef = ref(db, `userChats/${currentUser._id}`);
    const unsubscribeUserChats = onValue(userChatsRef, (snapshot) => {
      const data = snapshot.val();
      setIsInitialFetchDone(true);
      if (!data) {
        setUserChatsKeys([]);
        setChatsData({});
        setLoading(false);
        return;
      }

      const keys = Object.keys(data);
      setUserChatsKeys(keys);
    }, (error) => {
      console.error("Error reading userChats:", error);
      setIsInitialFetchDone(true);
      setLoading(false);
    });

    return () => {
      unsubscribeUserChats();
    };
  }, [currentUser]);

  // 2. Set up dynamic listeners for each chat ID in userChatsKeys
  useEffect(() => {
    if (userChatsKeys.length === 0) {
      setChatsData({});
      return;
    }

    // Clean up listeners that are no longer in userChatsKeys
    const keysSet = new Set(userChatsKeys);
    Object.keys(activeListenersRef.current).forEach((chatId) => {
      if (!keysSet.has(chatId)) {
        activeListenersRef.current[chatId](); // Call unsubscribe
        delete activeListenersRef.current[chatId];
        setChatsData((prev) => {
          const next = { ...prev };
          delete next[chatId];
          return next;
        });
      }
    });

    // Subscribe to new keys
    userChatsKeys.forEach((chatId) => {
      if (!activeListenersRef.current[chatId]) {
        const chatRef = ref(db, `chats/${chatId}`);
        const unsubscribe = onValue(chatRef, (snapshot) => {
          const val = snapshot.val();
          setChatsData((prev) => {
            return {
              ...prev,
              [chatId]: val || { _isEmpty: true },
            };
          });
        }, (error) => {
          console.error(`Error reading chat ${chatId}:`, error);
        });
        activeListenersRef.current[chatId] = unsubscribe;
      }
    });

    return () => {
      // Unsubscribe map is preserved and cleaned up in separate effect or on unmount
    };
  }, [userChatsKeys]);

  // Clean up all active chat listeners on unmount or user change
  useEffect(() => {
    return () => {
      Object.keys(activeListenersRef.current).forEach((chatId) => {
        activeListenersRef.current[chatId]();
      });
      activeListenersRef.current = {};
    };
  }, [currentUser]);

  // 3. Resolve user details and structure conversations list
  useEffect(() => {
    let isMounted = true;
    
    // If we have keys, wait until we have chat data for all of them to prevent premature empty states
    if (userChatsKeys.length > 0 && Object.keys(chatsData).length < userChatsKeys.length) {
      return;
    }

    // If userChatsKeys has no items, we are done loading and have no conversations
    if (userChatsKeys.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const resolveUsersAndConversations = async () => {
      const adminId = import.meta.env.VITE_ADMIN_ID;
      const isAdminUser = currentUser?._id === adminId;

      // Identify missing user IDs to fetch
      const userIdsToFetch = new Set();
      const chatItems = [];

      Object.keys(chatsData).forEach((chatId) => {
        const chat = chatsData[chatId];
        if (!chat || chat._isEmpty) return; // Skip empty/deleted chats

        const isParticipant = chatId.includes(currentUser._id);
        const isMediatedChat = chat?.isMediated === true;

        if (isParticipant || (isAdminUser && isMediatedChat)) {
          const parts = chatId.split("_");
          const otherUserId = parts[0] === currentUser._id ? parts[1] : parts[0];
          
          chatItems.push({
            chatId,
            otherUserId,
            rawChat: chat,
            isMediated: isMediatedChat,
            isDirectChat: isParticipant && !isMediatedChat,
            userAId: parts[0],
            userBId: parts[1]
          });

          if (isMediatedChat && !isParticipant) {
            if (!usersCacheRef.current[parts[0]]) {
              userIdsToFetch.add(parts[0]);
            }
            if (!usersCacheRef.current[parts[1]]) {
              userIdsToFetch.add(parts[1]);
            }
          } else {
            if (!usersCacheRef.current[otherUserId]) {
              userIdsToFetch.add(otherUserId);
            }
          }
        }
      });

      // Fetch missing users concurrently
      if (userIdsToFetch.size > 0) {
        try {
          await Promise.all(
            Array.from(userIdsToFetch).map(async (userId) => {
              try {
                const res = await api.get(`/users/${userId}`);
                usersCacheRef.current[userId] = res.data;
              } catch (err) {
                console.error(`Error fetching user ${userId}:`, err);
                // Set fallback
                usersCacheRef.current[userId] = {
                  _id: userId,
                  name: i18n.language === "ar" ? "مستخدم غير معروف" : "Unknown User",
                  profilePictureUrl: "",
                };
              }
            })
          );
        } catch (err) {
          console.error("Error during batch user details resolution:", err);
        }
      }

      if (!isMounted) return;

      // Map and structure resolved conversations
      const resolvedList = chatItems.map((item) => {
        let otherUser = null;
        let userA = null;
        let userB = null;

        if (item.isMediated && !item.isDirectChat) {
          userA = usersCacheRef.current[item.userAId] || { name: i18n.language === "ar" ? "مستخدم أ" : "User A" };
          userB = usersCacheRef.current[item.userBId] || { name: i18n.language === "ar" ? "مستخدم ب" : "User B" };
        } else {
          otherUser = usersCacheRef.current[item.otherUserId] || {
            _id: item.otherUserId,
            name: i18n.language === "ar" ? "مستخدم غير معروف" : "Unknown User",
            profilePictureUrl: "",
          };
        }

        const msgsObj = item.rawChat.messages || {};
        const msgsList = Object.keys(msgsObj).map((key) => ({
          id: key,
          ...msgsObj[key],
        }));

        msgsList.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        const lastMsg = msgsList[msgsList.length - 1] || null;

        const unreadCount = Object.values(msgsObj).filter(
          (msg) => msg.senderId !== currentUser._id && !(msg.readBy && msg.readBy[currentUser._id])
        ).length;

        return {
          chatId: item.chatId,
          isMediated: item.isMediated,
          isDirectChat: item.isDirectChat,
          otherUser,
          userA,
          userB,
          lastMessage: lastMsg,
          unreadCount,
        };
      });

      // Filter and sort
      const activeConversations = resolvedList.filter((c) => c.lastMessage !== null);
      activeConversations.sort((a, b) => {
        const timeA = a.lastMessage?.timestamp || 0;
        const timeB = b.lastMessage?.timestamp || 0;
        return timeB - timeA;
      });

      setConversations(activeConversations);
      setLoading(false);
    };

    resolveUsersAndConversations();

    return () => {
      isMounted = false;
    };
  }, [chatsData, currentUser, i18n.language]);

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString(i18n.language === "ar" ? "ar-EG" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString(i18n.language === "ar" ? "ar-EG" : "en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const renderLastMessagePreview = (msg) => {
    if (!msg) return "";
    if (msg.text) {
      return msg.text;
    }
    if ((msg.images && msg.images.length > 0) || msg.imageUrl) {
      return i18n.language === "ar" ? "📸 صورة" : "📸 Photo";
    }
    return "";
  };

  return (
    <div className="min-h-screen bg-cesar-darker font-cairo text-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header Block */}
        <section className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-cesar-dark/85 p-6 shadow-2xl backdrop-blur-md">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-cesar-cyan to-transparent" />
          <div className="pointer-events-none absolute -right-24 top-6 h-56 w-56 rounded-full bg-cesar-cyan/10 blur-3xl" />
          
          <div className="flex items-center gap-4 text-right">
            <img
              src="/default-avatar.png"
              alt="Avatar"
              className="inline-flex shrink-0 h-20 w-20 rounded-2xl border border-cesar-cyan/20 bg-cesar-darker/50 p-1 shadow-neon-cyan object-cover"
            />
            <div>
              <h1 className="text-2xl font-bold text-white md:text-3xl">
                {i18n.language === "ar" ? "الرسائل الواردة" : "Inbox Messages"}
              </h1>
              <p className="mt-1 text-sm text-cesar-gray">
                {i18n.language === "ar" 
                  ? "تواصل مع المشترين والبائعين مباشرة عبر محادثات فورية آمنة." 
                  : "Connect with buyers and sellers directly using secure instant messaging."}
              </p>
            </div>
          </div>
        </section>

        {/* Content Area */}
        {!isInitialFetchDone || loading ? (
          <div className="rounded-[2rem] border border-white/5 bg-cesar-dark/85 overflow-hidden shadow-2xl backdrop-blur-md divide-y divide-white/5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 sm:p-5">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* Avatar Skeleton */}
                  <div className="h-12 w-12 rounded-full bg-white/10 animate-pulse shrink-0" />
                  
                  {/* Text Skeleton */}
                  <div className="flex-1 min-w-0 text-right">
                    <div className="h-4 w-32 bg-white/10 rounded animate-pulse mb-2.5 ml-auto sm:ml-0" />
                    <div className="h-3.5 w-48 bg-white/5 rounded animate-pulse ml-auto sm:ml-0" />
                  </div>
                </div>
                
                {/* Time Skeleton */}
                <div className="shrink-0 flex flex-col items-end mr-4">
                  <div className="h-3 w-12 bg-white/5 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : isInitialFetchDone && conversations.length === 0 ? (
          <div className="rounded-[2rem] border border-white/5 bg-cesar-dark/70 p-12 text-center shadow-2xl backdrop-blur-md">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-cesar-cyan/20 bg-cesar-cyan/10 text-cesar-cyan">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-white">
              {i18n.language === "ar" ? "لا توجد رسائل حالياً" : "No Messages Yet"}
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-cesar-gray">
              {i18n.language === "ar" 
                ? "ابدأ بتصفح المنشورات وتواصل مع البائعين لبدء محادثتك الأولى." 
                : "Start browsing posts and contact sellers to initiate your first chat."}
            </p>
            <div className="mt-6">
              <Link
                to="/posts"
                className="inline-flex items-center gap-2 rounded-xl border border-cesar-cyan/30 bg-cesar-cyan/10 px-6 py-2.5 text-sm font-bold text-cesar-cyan transition duration-300 hover:bg-cesar-cyan/20 hover:shadow-neon-cyan"
              >
                {i18n.language === "ar" ? "تصفح الإعلانات" : "Browse Ads"}
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-[2rem] border border-white/5 bg-cesar-dark/80 overflow-hidden shadow-2xl backdrop-blur-md divide-y divide-white/5">
            {conversations.map((conv) => {
              const isMediatedAdminChat = conv.isMediated && !conv.isDirectChat;
              const chatTitle = conv.isMediated
                ? (isMediatedAdminChat 
                    ? `وساطة - تدخل إدارة (${conv.userA?.name || ""} و ${conv.userB?.name || ""})`
                    : `وساطة - تدخل إدارة (مع ${conv.otherUser?.name || ""})`
                  )
                : conv.otherUser?.name || "";

              return (
                <Link
                  key={conv.chatId}
                  to={conv.isMediated ? `/chat/${conv.chatId}` : `/chat/${conv.otherUser?._id}`}
                  className="flex items-center justify-between p-4 sm:p-5 hover:bg-white/5 transition duration-300 group"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* User Profile Picture */}
                    <div className="shrink-0">
                      {conv.isMediated ? (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 group-hover:border-yellow-500/50 transition-colors duration-300">
                          <ShieldAlert className="h-6 w-6 animate-pulse" />
                        </div>
                      ) : conv.otherUser?.profilePictureUrl ? (
                        <img
                          src={optimizeImage(conv.otherUser.profilePictureUrl)}
                          alt={conv.otherUser.name}
                          className="h-12 w-12 rounded-full object-cover border border-white/10 group-hover:border-cesar-cyan/50 transition-colors duration-300"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cesar-cyan/10 border border-cesar-cyan/20 text-cesar-cyan group-hover:border-cesar-cyan/50 transition-colors duration-300">
                          <User className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    {/* Message Preview details */}
                    <div className="min-w-0 flex-1 text-right">
                      <div className="flex items-center justify-end gap-2 flex-row-reverse">
                        <h3 className="font-bold text-white group-hover:text-cesar-cyan transition-colors duration-300 text-base truncate">
                          {chatTitle}
                        </h3>
                        {conv.isMediated && (
                          <span className="shrink-0 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-[10px] font-bold font-cairo px-2 py-0.5 rounded-full select-none">
                            تدخل إدارة
                          </span>
                        )}
                      </div>
                      <p className={`text-sm line-clamp-1 mt-1 transition-colors duration-300 ${
                        conv.unreadCount > 0 
                          ? "text-white font-bold" 
                          : "text-cesar-gray group-hover:text-slate-300"
                      }`}>
                        {renderLastMessagePreview(conv.lastMessage)}
                      </p>
                    </div>
                  </div>

                {/* Formatted last active time & Unread Badge */}
                <div className="shrink-0 flex flex-col items-end gap-1.5 text-left mr-4">
                  <span className="font-mono text-xs text-cesar-gray group-hover:text-cesar-cyan/85 transition-colors duration-300">
                    {formatTime(conv.lastMessage?.timestamp)}
                  </span>
                  {conv.unreadCount > 0 && (
                    <span className="bg-cesar-cyan text-cesar-dark h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-extrabold shadow-[0_0_10px_rgba(0,240,255,0.4)] animate-pulse">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
};

export default InboxPage;
