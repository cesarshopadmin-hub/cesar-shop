import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone,
  Plus,
  Loader2,
  ImagePlus,
  X,
  ThumbsUp,
  MessageCircle,
  Clock,
  Send,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  User,
  Ban,
  Trash2,
  AlertTriangle,
  Edit
} from "lucide-react";
import { ref, onValue, push, serverTimestamp, set, update, remove, query, limitToLast } from "firebase/database";
import { toast } from "react-toastify";
import { db } from "../Services/firebase";
import { useAuth } from "../context/AuthContext.jsx";
import { usePresence } from "../hooks/usePresence";
import { optimizeImage } from "../utils/imageOptimizer.js";
import api from "../Services/api.js";

const reactEmojis = { like: '👍', love: '❤️', fire: '🔥' };

const CesarChannelPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const currentUser = user?.name ? user : user?.user;
  usePresence(currentUser?._id, "channel");
  const adminId = import.meta.env.VITE_ADMIN_ID;
  const isAdmin = currentUser?._id === adminId;

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Lightbox State
  const [viewerImages, setViewerImages] = useState(null);
  const [viewerIndex, setViewerIndex] = useState(0);

  // React Menu State
  const [activeReactMenu, setActiveReactMenu] = useState(null);
  const [reactDetailsModal, setReactDetailsModal] = useState(null);

  // Comments State
  const [commentsModal, setCommentsModal] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  // New Post Form State
  const [newPostText, setNewPostText] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  // Edit/Delete Post State
  const [postToDelete, setPostToDelete] = useState(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [editPostData, setEditPostData] = useState(null); // { id, text }
  const [isUpdatingPost, setIsUpdatingPost] = useState(false);

  // Fetch posts from Firebase Realtime Database
  useEffect(() => {
    const postsQuery = query(ref(db, "cesar_channel/posts"), limitToLast(30));
    const unsubscribe = onValue(postsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const postList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        // Sort by timestamp (newest first)
        postList.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setPosts(postList);
      } else {
        setPosts([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching channel posts:", error);
      toast.error(i18n.language === "ar" ? "تعذر تحميل منشورات القناة" : "Failed to load channel posts");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [i18n.language]);

  const [channelImage, setChannelImage] = useState("");
  const [isUploadingChannelImage, setIsUploadingChannelImage] = useState(false);
  const channelImageInputRef = useRef(null);

  // Fetch channel metadata (like custom image)
  useEffect(() => {
    const channelImageRef = ref(db, "cesar_channel/channelImage");
    const unsubscribe = onValue(channelImageRef, (snapshot) => {
      setChannelImage(snapshot.val() || "");
    });
    return () => unsubscribe();
  }, []);

  const handleChannelImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingChannelImage(true);
    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = (import.meta.env.VITE_CLOUDINARY_CHAT_PRESET || "chat_media").replace(/"/g, "");

      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("upload_preset", uploadPreset);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: uploadData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload image to Cloudinary");
      }

      const data = await response.json();
      const secureUrl = data.secure_url || "";
      const formattedUrl = secureUrl.replace("/upload/", "/upload/f_auto,q_auto,w_800/");

      await set(ref(db, "cesar_channel/channelImage"), formattedUrl);
      toast.success(i18n.language === "ar" ? "تم تحديث صورة القناة بنجاح!" : "Channel image updated successfully!");
    } catch (err) {
      console.error("Error uploading channel image:", err);
      toast.error(i18n.language === "ar" ? "تعذر رفع الصورة" : "Failed to upload image");
    } finally {
      setIsUploadingChannelImage(false);
    }
  };

  // Image caching/preview helper
  const objectUrlCache = useRef(new Map());
  const getObjectURL = (file) => {
    if (typeof file === "string") return file;
    if (!objectUrlCache.current.has(file)) {
      objectUrlCache.current.set(file, URL.createObjectURL(file));
    }
    return objectUrlCache.current.get(file);
  };

  useEffect(() => {
    return () => {
      objectUrlCache.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files || []);
    const totalFiles = [...selectedImages, ...files];
    if (totalFiles.length > 5) {
      toast.error(i18n.language === "ar" ? "لا يمكنك رفع أكثر من 5 صور" : "Cannot upload more than 5 images");
      setSelectedImages(totalFiles.slice(0, 5));
    } else {
      setSelectedImages(totalFiles);
    }
  };

  const handleRemoveImage = (index) => {
    const fileToRemove = selectedImages[index];
    if (fileToRemove && typeof fileToRemove !== "string") {
      const cachedUrl = objectUrlCache.current.get(fileToRemove);
      if (cachedUrl) {
        URL.revokeObjectURL(cachedUrl);
        objectUrlCache.current.delete(fileToRemove);
      }
    }
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePublishPost = async (e) => {
    e.preventDefault();
    if (!newPostText.trim() && selectedImages.length === 0) {
      toast.error(i18n.language === "ar" ? "يرجى كتابة نص أو إرفاق صور للمنشور" : "Please enter text or attach images for the post");
      return;
    }

    setIsPublishing(true);  
    let uploadedUrlsArray = [];

    try {
      // 1. Upload images to Cloudinary if any are selected
      if (selectedImages.length > 0) {
        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = (import.meta.env.VITE_CLOUDINARY_CHAT_PRESET || "chat_media").replace(/"/g, "");

        const uploadPromises = selectedImages.map(async (file) => {
          const uploadData = new FormData();
          uploadData.append("file", file);
          uploadData.append("upload_preset", uploadPreset);

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
              method: "POST",
              body: uploadData,
            }
          );

          if (!response.ok) {
            throw new Error("Failed to upload image to Cloudinary");
          }

          const data = await response.json();
          // Transform URL to include f_auto,q_auto,w_800 for optimal loading performance
          const secureUrl = data.secure_url || "";
          return secureUrl.replace("/upload/", "/upload/f_auto,q_auto,w_800/");
        });

        uploadedUrlsArray = await Promise.all(uploadPromises);
      }

      // 2. Save post to Firebase Realtime Database
      const newPostRef = push(ref(db, "cesar_channel/posts"));
      await set(newPostRef, {
        text: newPostText.trim(),
        images: uploadedUrlsArray,
        timestamp: serverTimestamp(),
        senderId: currentUser._id,
        reacts: {},
        commentsCount: 0
      });

      toast.success(i18n.language === "ar" ? "تم نشر المنشور بنجاح!" : "Post published successfully!");
      setNewPostText("");
      setSelectedImages([]);
      setFileInputKey((prev) => prev + 1);
      setShowAddModal(false);
    } catch (err) {
      console.error("Error creating channel post:", err);
      toast.error(i18n.language === "ar" ? "حدث خطأ أثناء النشر" : "Failed to publish post");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleReact = async (postId, currentReacts, reactType) => {
    if (!currentUser?._id) return;
    const userCurrentReact = currentReacts?.[currentUser._id];

    try {
      if (userCurrentReact === reactType) {
        await remove(ref(db, `cesar_channel/posts/${postId}/reacts/${currentUser._id}`));
      } else {
        await set(ref(db, `cesar_channel/posts/${postId}/reacts/${currentUser._id}`), reactType);
      }
      setActiveReactMenu(null);
    } catch (err) {
      console.error("Error setting reaction:", err);
      toast.error(i18n.language === "ar" ? "تعذر تسجيل التفاعل" : "Failed to record reaction");
    }
  };

  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser?._id) return;

    setIsCommenting(true);
    try {
      const commentsRef = ref(db, `cesar_channel/posts/${postId}/comments`);
      const newCommentRef = push(commentsRef);
      await set(newCommentRef, {
        text: newComment.trim(),
        senderId: currentUser._id,
        senderName: currentUser.name || (i18n.language === "ar" ? "مستخدم" : "User"),
        senderImage: currentUser.profilePictureUrl || "",
        timestamp: serverTimestamp()
      });

      const currentCount = posts.find(p => p.id === postId)?.commentsCount || 0;
      await update(ref(db), {
        [`cesar_channel/posts/${postId}/commentsCount`]: currentCount + 1
      });

      setNewComment("");
    } catch (err) {
      console.error("Error adding comment:", err);
      toast.error(i18n.language === "ar" ? "تعذر إضافة التعليق" : "Failed to add comment");
    } finally {
      setIsCommenting(false);
    }
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    try {
      await update(ref(db), {
        [`cesar_channel/posts/${commentToDelete.postId}/comments/${commentToDelete.commentId}/isDeleted`]: true
      });
      toast.success(i18n.language === "ar" ? "تم حذف التعليق" : "Comment deleted");
    } catch (err) {
      console.error("Error deleting comment:", err);
      toast.error(i18n.language === "ar" ? "تعذر حذف التعليق" : "Failed to delete comment");
    } finally {
      setCommentToDelete(null);
    }
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    setIsDeletingPost(true);
    try {
      // Delete each image from Cloudinary before removing the Firebase node
      if (postToDelete.images && postToDelete.images.length > 0) {
        const deletionResults = await Promise.allSettled(
          postToDelete.images
            .filter((url) => url && url.includes("cloudinary"))
            .map((url) => api.post("/chat/delete-image", { imageUrl: url }))
        );

        deletionResults.forEach((result, idx) => {
          if (result.status === "rejected") {
            console.warn(`Failed to delete Cloudinary image [${idx}]:`, result.reason);
          }
        });
      }

      await remove(ref(db, `cesar_channel/posts/${postToDelete.id}`));
      toast.success(i18n.language === "ar" ? "تم حذف المنشور بنجاح!" : "Post deleted successfully!");
    } catch (err) {
      console.error("Error deleting post:", err);
      toast.error(i18n.language === "ar" ? "تعذر حذف المنشور" : "Failed to delete post");
    } finally {
      setIsDeletingPost(false);
      setPostToDelete(null);
    }
  };

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    if (!editPostData || !editPostData.text.trim()) {
      toast.error(i18n.language === "ar" ? "يرجى كتابة نص للمنشور" : "Please enter text for the post");
      return;
    }

    setIsUpdatingPost(true);
    try {
      await update(ref(db, `cesar_channel/posts/${editPostData.id}`), {
        text: editPostData.text.trim()
      });
      toast.success(i18n.language === "ar" ? "تم تحديث المنشور بنجاح!" : "Post updated successfully!");
      setEditPostData(null);
    } catch (err) {
      console.error("Error updating post:", err);
      toast.error(i18n.language === "ar" ? "تعذر تحديث المنشور" : "Failed to update post");
    } finally {
      setIsUpdatingPost(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleDateString(i18n.language === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div dir={i18n.dir()} className="min-h-screen px-4 py-8 bg-cesar-darker font-cairo text-white">
      <div className="mx-auto max-w-2xl">
        
        {/* Channel Header Banner */}
        <div className="relative mb-8 overflow-hidden rounded-[2rem] border border-white/5 bg-cesar-dark/80 p-6 md:p-8 shadow-2xl backdrop-blur-md">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-cesar-cyan to-transparent" />
          <div className="pointer-events-none absolute -right-20 top-16 h-36 w-36 rounded-full bg-cesar-cyan/10 blur-3xl" />
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                onClick={() => isAdmin && !isUploadingChannelImage && channelImageInputRef.current?.click()}
                className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-cesar-cyan/20 bg-cesar-cyan/10 text-cesar-cyan shadow-[0_0_15px_rgba(0,209,255,0.2)] overflow-hidden relative group ${
                  isAdmin ? "cursor-pointer hover:border-cesar-cyan/50" : ""
                }`}
              >
                {isUploadingChannelImage ? (
                  <Loader2 className="h-6 w-6 animate-spin text-cesar-cyan" />
                ) : channelImage ? (
                  <img
                    src={optimizeImage(channelImage) || channelImage}
                    alt="Channel"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-110"
                  />
                ) : (
                  <Megaphone className="h-8 w-8" />
                )}

                {isAdmin && !isUploadingChannelImage && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-200">
                    <span className="text-[10px] text-white font-bold font-cairo">تعديل</span>
                  </div>
                )}
              </div>

              {isAdmin && (
                <input
                  type="file"
                  ref={channelImageInputRef}
                  onChange={handleChannelImageUpload}
                  className="hidden"
                  accept="image/*"
                />
              )}
              <div className="text-right">
                <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
                  {i18n.language === "ar" ? "قناة سيزار" : "Cesar Channel"}
                </h1>
                <p className="mt-1.5 text-xs md:text-sm text-cesar-gray">
                  {i18n.language === "ar" 
                    ? "تابع أحدث العروض والمنشورات الرسمية من الإدارة مباشرة."
                    : "Follow the latest official updates and posts directly from the Admin."}
                </p>
              </div>
            </div>

            {isAdmin && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center justify-center gap-2 rounded-xl border border-cesar-cyan/50 bg-cesar-cyan/10 px-4 py-2.5 text-sm font-bold text-cesar-cyan transition duration-300 hover:bg-cesar-cyan/25 hover:shadow-neon-cyan active:scale-95 shrink-0 self-start sm:self-center"
              >
                <Plus className="h-4.5 w-4.5" />
                <span>{i18n.language === "ar" ? "منشور جديد" : "New Post"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Channel Feed */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-cesar-cyan" />
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12 rounded-[2rem] border border-white/5 bg-cesar-dark/40">
            <Megaphone className="h-12 w-12 text-cesar-gray opacity-40 mb-4" />
            <h3 className="text-lg font-bold text-slate-300">
              {i18n.language === "ar" ? "القناة فارغة حالياً" : "The channel is currently empty"}
            </h3>
            <p className="text-sm text-cesar-gray mt-1">
              {i18n.language === "ar" ? "لا توجد منشورات رسمية بعد." : "There are no official posts yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden rounded-3xl border border-white/5 bg-cesar-dark/80 p-5 md:p-6 shadow-xl backdrop-blur-md relative"
              >
                {/* Post Header */}
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cesar-cyan/10 border border-cesar-cyan/20 text-cesar-cyan shadow-[0_0_8px_rgba(0,209,255,0.15)]">
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <div className="text-right">
                      <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                        {i18n.language === "ar" ? "الإدارة" : "Administration"}
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] bg-cesar-cyan/15 text-cesar-cyan font-bold">✓</span>
                      </h4>
                      <div className="flex items-center gap-1 mt-0.5 text-[10px] text-cesar-gray">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimestamp(post.timestamp)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for Admin */}
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditPostData({ id: post.id, text: post.text })}
                        className="rounded-lg p-1.5 bg-white/5 text-cesar-gray hover:text-cesar-cyan hover:bg-cesar-cyan/10 transition"
                        title={i18n.language === "ar" ? "تعديل" : "Edit"}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setPostToDelete(post)}
                        className="rounded-lg p-1.5 bg-white/5 text-cesar-gray hover:text-red-500 hover:bg-red-500/10 transition"
                        title={i18n.language === "ar" ? "حذف" : "Delete"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Post Body (Text) */}
                {post.text && (
                  <div className="text-sm md:text-base leading-relaxed text-right text-slate-100 whitespace-pre-wrap break-words mb-4 font-normal">
                    {post.text}
                  </div>
                )}

                {/* Post Body (Images) */}
                {post.images && post.images.length > 0 && (
                  <div
                    className={`grid gap-2 mt-3 mb-5 overflow-hidden ${
                      post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                    }`}
                  >
                    {post.images.map((imgUrl, idx) => (
                      <img
                        key={idx}
                        src={optimizeImage(imgUrl)}
                        alt={`Channel media ${idx}`}
                        className={`w-full object-cover rounded-xl cursor-pointer hover:opacity-90 transition duration-300 ${
                          post.images.length === 1 ? "h-64 sm:h-80" : "aspect-square"
                        }`}
                        onClick={() => {
                          setViewerImages(post.images);
                          setViewerIndex(idx);
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Post Footer Actions Placeholder */}
                <div className="flex items-center gap-4 border-t border-white/5 pt-3 text-xs md:text-sm text-cesar-gray">
                  {(() => {
                    const myReact = post.reacts?.[currentUser?._id];
                    const reactsArray = Object.values(post.reacts || {});
                    const totalReacts = reactsArray.length;
                    
                    // Unique emojis used for preview
                    const uniqueEmojis = Array.from(new Set(reactsArray)).map(r => reactEmojis[r]);

                    return (
                      <div className="relative flex items-center gap-1 bg-white/5 hover:bg-white/10 transition rounded-xl p-1">
                        {/* Icon Part */}
                        <button
                          type="button"
                          onClick={() => setActiveReactMenu(activeReactMenu === post.id ? null : post.id)}
                          className={`flex items-center justify-center p-1.5 rounded-lg transition ${
                            myReact ? "text-cesar-cyan bg-cesar-cyan/10" : "text-cesar-gray hover:text-white"
                          }`}
                          title={i18n.language === "ar" ? "تفاعل" : "React"}
                        >
                          {myReact ? (
                            <span className="text-sm scale-110">{reactEmojis[myReact]}</span>
                          ) : (
                            <ThumbsUp className="h-4 w-4" />
                          )}
                        </button>

                        {/* Divider */}
                        {totalReacts > 0 && <span className="h-4 w-[1px] bg-white/10" />}

                        {/* Counter/Text Part */}
                        {totalReacts > 0 && (
                          <button
                            type="button"
                            onClick={() => setReactDetailsModal(post.id)}
                            className="flex items-center gap-1.5 px-2 py-1 text-cesar-cyan hover:text-white transition font-bold"
                          >
                            <span className="flex items-center gap-0.5 select-none text-[10px]">
                              {uniqueEmojis.slice(0, 3).map((emoji, i) => (
                                <span key={i}>{emoji}</span>
                              ))}
                            </span>
                            <span className="text-xs">{totalReacts}</span>
                          </button>
                        )}

                        <AnimatePresence>
                          {activeReactMenu === post.id && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute bottom-full mb-2 right-0 flex gap-2 bg-cesar-darker border border-white/10 rounded-full px-3 py-2 shadow-xl z-10"
                            >
                              <button
                                type="button"
                                onClick={() => handleReact(post.id, post.reacts, 'like')}
                                className="hover:scale-125 transition duration-150 text-base"
                                title="👍 Like"
                              >
                                👍
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReact(post.id, post.reacts, 'love')}
                                className="hover:scale-125 transition duration-150 text-base"
                                title="❤️ Love"
                              >
                                ❤️
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReact(post.id, post.reacts, 'fire')}
                                className="hover:scale-125 transition duration-150 text-base"
                                title="🔥 Fire"
                              >
                                🔥
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })()}

                  <button
                    type="button"
                    onClick={() => setCommentsModal(post.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 hover:text-white transition font-bold"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>{i18n.language === "ar" ? "التعليقات" : "Comments"}</span>
                    {post.commentsCount > 0 && (
                      <span className="bg-cesar-cyan/25 text-cesar-cyan px-2 py-0.5 rounded-full text-[10px] animate-pulse">
                        {post.commentsCount}
                      </span>
                    )}
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        )}

      </div>

      {/* Admin Add Post Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/10 bg-cesar-dark p-6 shadow-2xl text-right"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-cesar-cyan to-transparent" />
              
              <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl p-1 bg-white/5 text-cesar-gray hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-cesar-cyan" />
                  <span>{i18n.language === "ar" ? "إضافة منشور جديد للقناة" : "Add New Channel Post"}</span>
                </h3>
              </div>

              <form onSubmit={handlePublishPost} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 mr-1">
                    {i18n.language === "ar" ? "نص المنشور" : "Post Text"}
                  </label>
                  <textarea
                    rows={4}
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                    placeholder={i18n.language === "ar" ? "اكتب الإعلان هنا..." : "Write your announcement here..."}
                    className="w-full resize-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-cesar-cyan focus:ring-1 focus:ring-cesar-cyan transition leading-relaxed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 mr-1">
                    {i18n.language === "ar" ? "الصور المرفقة (اختيارى) (حد أقصى 5)" : "Attachments (Max 5)"}
                  </label>
                  
                  <label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-white/10 bg-black/30 px-4 py-4 hover:border-cesar-cyan/60 hover:bg-black/40 transition">
                    <ImagePlus className="h-5 w-5 text-cesar-cyan" />
                    <span className="text-xs font-medium text-slate-300">
                      {i18n.language === "ar" ? "اختر صور للمنشور (اختيارى)" : "Select Post Images"}
                    </span>
                    <input
                      key={fileInputKey}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  {selectedImages.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {selectedImages.map((file, idx) => {
                        const url = getObjectURL(file);
                        return (
                          <div key={idx} className="relative h-16 w-16 rounded-xl border border-white/5 overflow-hidden">
                            <img src={url} alt={`selected-${idx}`} className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-650 text-white hover:bg-red-500 transition text-[10px] font-bold"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isPublishing}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-cesar-cyan/50 bg-cesar-cyan/10 px-4 py-3 font-bold text-cesar-cyan transition hover:bg-cesar-cyan/20 disabled:opacity-50"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>{i18n.language === "ar" ? "جاري النشر..." : "Publishing..."}</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4.5 w-4.5" />
                      <span>{i18n.language === "ar" ? "نشر المنشور" : "Publish Post"}</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Lightbox Modal */}
      {viewerImages && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm">
          <button
            onClick={() => setViewerImages(null)}
            className="absolute top-4 left-4 rounded-xl p-2 bg-white/5 text-cesar-gray hover:text-white transition duration-300"
            title="إغلاق"
          >
            <X className="h-6 w-6" />
          </button>
          
          {viewerImages.length > 1 && (
            <>
              <button
                onClick={() => setViewerIndex((prev) => (prev - 1 + viewerImages.length) % viewerImages.length)}
                className="absolute left-4 p-3 rounded-full bg-white/5 hover:bg-white/10 hover:text-white transition duration-300 z-10"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={() => setViewerIndex((prev) => (prev + 1) % viewerImages.length)}
                className="absolute right-4 p-3 rounded-full bg-white/5 hover:bg-white/10 hover:text-white transition duration-300 z-10"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <div className="max-w-[90%] max-h-[85%] flex items-center justify-center">
            <img
              src={optimizeImage(viewerImages[viewerIndex])}
              alt={`preview-${viewerIndex}`}
              className="max-w-full max-h-[80vh] object-contain rounded-xl select-none"
            />
          </div>
        </div>
      )}

      {/* React Details Modal */}
      <AnimatePresence>
        {reactDetailsModal && (() => {
          const targetPost = posts.find(p => p.id === reactDetailsModal);
          if (!targetPost) return null;

          const reactsArray = Object.values(targetPost.reacts || {});
          const totalReacts = reactsArray.length;
          const reactCounts = {
            like: reactsArray.filter(r => r === 'like').length,
            love: reactsArray.filter(r => r === 'love').length,
            fire: reactsArray.filter(r => r === 'fire').length
          };

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/10 bg-cesar-dark p-6 shadow-2xl text-right"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-cesar-cyan to-transparent" />
                
                <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-3">
                  <button
                    onClick={() => setReactDetailsModal(null)}
                    className="rounded-xl p-1 bg-white/5 text-cesar-gray hover:text-white transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <h3 className="text-lg font-bold text-white">
                    {i18n.language === "ar" ? "تفاصيل التفاعلات" : "Reaction Details"}
                  </h3>
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-semibold text-slate-300">
                    {i18n.language === "ar" ? `إجمالي التفاعلات: ${totalReacts}` : `Total Reactions: ${totalReacts}`}
                  </p>

                  <div className="flex flex-wrap gap-2.5 justify-end">
                    {reactCounts.love > 0 && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-bold">
                        <span>❤️</span>
                        <span>{reactCounts.love}</span>
                      </span>
                    )}
                    {reactCounts.like > 0 && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-bold">
                        <span>👍</span>
                        <span>{reactCounts.like}</span>
                      </span>
                    )}
                    {reactCounts.fire > 0 && (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-bold">
                        <span>🔥</span>
                        <span>{reactCounts.fire}</span>
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setReactDetailsModal(null)}
                  className="mt-6 w-full py-2.5 rounded-xl border border-white/10 bg-white/5 font-bold hover:bg-white/10 transition text-sm text-center"
                >
                  {i18n.language === "ar" ? "إغلاق" : "Close"}
                </button>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Comments Drawer Modal */}
      <AnimatePresence>
        {commentsModal && (() => {
          const targetPost = posts.find(p => p.id === commentsModal);
          if (!targetPost) return null;

          const commentsEntries = Object.entries(targetPost.comments || {})
            .sort((a, b) => (a[1].timestamp || 0) - (b[1].timestamp || 0));

          return (
            <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm p-2 pb-[4.5rem] sm:p-4 sm:pb-4">
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="w-full max-w-2xl mx-auto bg-cesar-darker rounded-t-3xl border border-white/10 flex flex-col max-h-[85vh] overflow-hidden text-right shadow-2xl relative"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-cesar-cyan to-transparent" />
                
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/5 bg-cesar-dark/40">
                  <button
                    onClick={() => setCommentsModal(null)}
                    className="rounded-xl p-1 bg-white/5 text-cesar-gray hover:text-white transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-cesar-cyan" />
                    <span>
                      {i18n.language === "ar" ? "التعليقات" : "Comments"}
                      <span className="mr-1.5 px-2 py-0.5 rounded bg-cesar-cyan/15 text-cesar-cyan text-xs font-bold font-cairo">
                        {targetPost.commentsCount || 0}
                      </span>
                    </span>
                  </h3>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-cesar-darker/60">
                  {commentsEntries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center opacity-40">
                      <MessageCircle className="h-10 w-10 mb-2" />
                      <p className="text-sm font-medium">
                        {i18n.language === "ar" ? "لا توجد تعليقات بعد" : "No comments yet"}
                      </p>
                      <p className="text-xs mt-0.5">
                        {i18n.language === "ar" ? "كن أول من يكتب تعليقاً على هذا المنشور!" : "Be the first to share your thoughts!"}
                      </p>
                    </div>
                  ) : (
                    commentsEntries.map(([commentId, comment]) => (
                      <div key={commentId} className="flex items-start gap-3 justify-start text-right">
                        {comment.senderImage ? (
                          <img
                            src={optimizeImage(comment.senderImage)}
                            alt={comment.senderName}
                            className="h-9 w-9 rounded-full object-cover border border-white/5"
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/5 text-cesar-gray">
                            <User className="h-4 w-4" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tr-none px-4 py-2 text-start inline-block max-w-[90%] break-words">
                            <h5 className="text-xs font-bold text-cesar-cyan mb-1">
                              {comment.senderName}
                            </h5>
                            {comment.isDeleted ? (
                              <p className="text-xs text-cesar-gray font-normal italic flex items-center gap-1.5 leading-relaxed">
                                <Ban className="h-3.5 w-3.5 text-cesar-gray" />
                                {i18n.language === "ar" ? "تم مسح هذا التعليق" : "This comment was deleted"}
                              </p>
                            ) : (
                              <p className="text-sm text-slate-100 font-normal leading-relaxed whitespace-pre-wrap">
                                {comment.text}
                              </p>
                            )}
                          </div>
                          <div className="mt-1 mr-2 text-[9px] text-cesar-gray flex items-center justify-start gap-2">
                            <div className="flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" />
                              <span>{formatTimestamp(comment.timestamp)}</span>
                            </div>
                            {!comment.isDeleted && comment.senderId === currentUser?._id && (
                              <button
                                type="button"
                                onClick={() => setCommentToDelete({ postId: targetPost.id, commentId })}
                                className="text-cesar-gray hover:text-red-500 transition duration-200"
                                title={i18n.language === "ar" ? "حذف التعليق" : "Delete Comment"}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer Input Area */}
                <form
                  onSubmit={(e) => handleAddComment(e, targetPost.id)}
                  className="p-3 pb-4 bg-cesar-dark border-t border-white/5 flex gap-2 items-center"
                >
                  <button
                    type="submit"
                    disabled={isCommenting || !newComment.trim()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cesar-cyan/50 bg-cesar-cyan/10 text-cesar-cyan hover:bg-cesar-cyan/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isCommenting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 rotate-180" />
                    )}
                  </button>
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={i18n.language === "ar" ? "اكتب تعليقاً..." : "Write a comment..."}
                    className="flex-1 rounded-xl border border-white/10 bg-black/45 px-4 py-2.5 text-sm text-white outline-none focus:border-cesar-cyan transition text-right"
                  />
                </form>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Delete Comment Confirmation Modal */}
      <AnimatePresence>
        {commentToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/10 bg-cesar-dark p-6 shadow-2xl text-center"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />
              
              <div className="flex flex-col items-center gap-4 mt-2 mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                  <AlertTriangle className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-cairo">
                    {i18n.language === "ar" ? "تأكيد مسح التعليق" : "Confirm Delete Comment"}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-cesar-gray">
                    {i18n.language === "ar"
                      ? "هل أنت متأكد أنك تريد مسح هذا التعليق نهائياً؟"
                      : "Are you sure you want to permanently delete this comment?"}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={confirmDeleteComment}
                  className="flex-1 py-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20 transition text-sm font-bold text-center"
                >
                  {i18n.language === "ar" ? "نعم، امسح" : "Yes, delete"}
                </button>
                <button
                  onClick={() => setCommentToDelete(null)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 text-cesar-gray border border-white/5 hover:bg-white/10 hover:text-white transition text-sm font-bold text-center"
                >
                  {i18n.language === "ar" ? "إلغاء" : "Cancel"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Post Confirmation Modal */}
      <AnimatePresence>
        {postToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/10 bg-cesar-dark p-6 shadow-2xl text-center"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />
              
              <div className="flex flex-col items-center gap-4 mt-2 mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                  <AlertTriangle className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-cairo">
                    {i18n.language === "ar" ? "تأكيد حذف المنشور" : "Confirm Delete Post"}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-cesar-gray font-cairo">
                    {i18n.language === "ar"
                      ? "هل أنت متأكد أنك تريد حذف هذا المنشور وجميع تفاعلاته نهائياً؟"
                      : "Are you sure you want to permanently delete this post and all its reactions?"}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 font-cairo">
                <button
                  onClick={confirmDeletePost}
                  disabled={isDeletingPost}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20 transition text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeletingPost ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {isDeletingPost ? (i18n.language === "ar" ? "جارٍ الحذف..." : "Deleting...") : (i18n.language === "ar" ? "نعم، احذف" : "Yes, delete")}
                </button>
                <button
                  onClick={() => setPostToDelete(null)}
                  disabled={isDeletingPost}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 text-cesar-gray border border-white/5 hover:bg-white/10 hover:text-white transition text-sm font-bold text-center disabled:opacity-50"
                >
                  {i18n.language === "ar" ? "إلغاء" : "Cancel"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Post Modal */}
      <AnimatePresence>
        {editPostData && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-cesar-dark p-6 shadow-2xl text-right animate-fadeIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-cesar-cyan to-transparent" />
              
              <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-3">
                <button
                  onClick={() => setEditPostData(null)}
                  className="rounded-xl p-1 bg-white/5 text-cesar-gray hover:text-white transition animate-pulse"
                >
                  <X className="h-5 w-5" />
                </button>
                <h3 className="text-lg font-bold text-white font-cairo">
                  {i18n.language === "ar" ? "تعديل المنشور" : "Edit Post"}
                </h3>
              </div>

              <form onSubmit={handleUpdatePost}>
                <textarea
                  value={editPostData.text}
                  onChange={(e) => setEditPostData({ ...editPostData, text: e.target.value })}
                  placeholder={i18n.language === "ar" ? "اكتب محتوى المنشور الجديد..." : "Write your new post content..."}
                  className="w-full min-h-[120px] rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-cesar-cyan transition text-right resize-none font-cairo"
                  rows="4"
                />

                <div className="flex gap-3 mt-5 font-cairo">
                  <button
                    type="submit"
                    disabled={isUpdatingPost || !editPostData.text.trim()}
                    className="flex-1 py-2.5 rounded-xl border border-cesar-cyan/50 bg-cesar-cyan/10 text-cesar-cyan hover:bg-cesar-cyan/20 transition text-sm font-bold text-center flex items-center justify-center gap-2"
                  >
                    {isUpdatingPost && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>{i18n.language === "ar" ? "حفظ التغييرات" : "Save Changes"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditPostData(null)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 text-cesar-gray border border-white/5 hover:bg-white/10 hover:text-white transition text-sm font-bold text-center"
                  >
                    {i18n.language === "ar" ? "إلغاء" : "Cancel"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CesarChannelPage;
