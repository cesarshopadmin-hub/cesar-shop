import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, LayoutList, PlusSquare, User, LogIn, UserPlus, LogOut, Shield, MessageSquare, Megaphone } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import CesarLogo from "../CesarLogo";
import FloatingWarning from "../ui/FloatingWarning";
import { ref, onValue } from "firebase/database";
import { db } from "../../Services/firebase";
// import ParticleBackground from "./ParticleBackground";

function MainLayout() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { token, logout, user } = useAuth(); 

  const isActive = (path) => location.pathname === path;
  const isLoggedIn = !!token; 
  
  const currentUser = user?.name ? user : user?.user;
  const isAdmin = currentUser?.role === "admin";

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser?._id) {
      setUnreadCount(0);
      return;
    }

    const adminId = import.meta.env.VITE_ADMIN_ID;

    const chatsRef = ref(db, "chats");
    const unsubscribe = onValue(chatsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setUnreadCount(0);
        return;
      }

      let total = 0;
      Object.keys(data).forEach((chatId) => {
        const isParticipant = chatId.includes(currentUser._id);
        const isMediatedChat = data[chatId]?.isMediated === true;
        const isAdminUser = currentUser._id === adminId;

        if (isParticipant || (isAdminUser && isMediatedChat)) {
          const chat = data[chatId];
          const messagesObj = chat.messages || {};
          const count = Object.values(messagesObj).filter(
            (msg) => msg.senderId !== currentUser._id && !(msg.readBy && msg.readBy[currentUser._id])
          ).length;
          total += count;
        }
      });
      setUnreadCount(total);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isChatRoute = location.pathname.startsWith("/chat/");

  return (
    <div className={`min-h-screen bg-cesar-darker text-white font-cairo ${isChatRoute ? "" : "pb-16"} md:pb-0 relative`} dir="rtl">
    
    {/* <ParticleBackground />  */}

    <div className="relative z-10"> 
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            
            <div className="flex items-center gap-2">
              <Link to="/" className="flex items-center gap-3 text-xl font-black tracking-wide text-cesar-cyan drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">
                <CesarLogo className="w-16 h-16" />
                <span>{t("nav.logo")}</span>
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link to="/" className={`transition hover:text-cesar-cyan ${isActive('/') ? 'text-cesar-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : 'text-slate-300'}`}>{t("nav.home")}</Link>
              <Link to="/posts" className={`transition hover:text-cesar-cyan ${isActive('/posts') ? 'text-cesar-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : 'text-slate-300'}`}>{t("nav.posts")}</Link>
              
              {isLoggedIn && (
                <Link to="/channel" className={`transition hover:text-cesar-cyan flex items-center gap-1 ${isActive('/channel') ? 'text-cesar-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : 'text-slate-300'}`}>
                  <Megaphone className="h-4 w-4" /> {t("nav.channel")}
                </Link>
              )}
              
              {isLoggedIn ? (
                <>
                  <Link to="/inbox" className={`transition hover:text-cesar-cyan relative ${isActive('/inbox') ? 'text-cesar-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : 'text-slate-300'}`}>
                    {t("nav.inbox")}
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[9px] h-4 w-4 flex items-center justify-center rounded-full absolute -top-2 -right-3 font-bold scale-90 animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link to="/add-post" className={`transition hover:text-cesar-cyan ${isActive('/add-post') ? 'text-cesar-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : 'text-slate-300'}`}>{t("nav.addPost")}</Link>
                  <Link to="/profile" className={`transition hover:text-cesar-cyan ${isActive('/profile') ? 'text-cesar-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : 'text-slate-300'}`}>{t("nav.profile")}</Link>
                  
                  {isAdmin && (
                    <Link to="/admin/dashboard" className={`transition hover:text-cesar-cyan flex items-center gap-1 ${isActive('/admin/dashboard') ? 'text-cesar-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : 'text-emerald-400'}`}>
                      <Shield className="h-4 w-4" /> {t("nav.admin")}
                    </Link>
                  )}

                  <button onClick={handleLogout} className="flex items-center gap-1 text-red-400 transition hover:text-red-300 hover:drop-shadow-[0_0_8px_rgba(248,113,113,0.6)]">
                    <LogOut className="h-4 w-4" /> {t("nav.logout")}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className={`transition hover:text-cesar-cyan ${isActive('/login') ? 'text-cesar-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : 'text-slate-300'}`}>{t("nav.login")}</Link>
                  <Link to="/register" className="rounded-full border border-cesar-cyan/30 bg-cesar-cyan/10 px-4 py-1.5 text-cesar-cyan transition hover:bg-cesar-cyan/20 hover:shadow-neon-cyan">
                    {t("nav.register")}
                  </Link>
                </>
              )}
            </div>

          </div>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>

      {!isChatRoute && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-[#0a0f16]/95 backdrop-blur-lg">
        <div className="flex justify-around items-center h-16">
          
          <Link to="/" className="flex flex-col items-center gap-1 w-full pt-2 pb-1">
            <Home className={`h-5 w-5 ${isActive('/') ? 'text-cesar-cyan' : 'text-slate-400'}`} />
            <span className={`text-[10px] font-medium ${isActive('/') ? 'text-cesar-cyan' : 'text-slate-400'}`}>{t("nav.home")}</span>
            {isActive('/') && <span className="h-1 w-1 rounded-full bg-cesar-cyan shadow-[0_0_8px_rgba(0,240,255,0.8)] mt-0.5"></span>}
          </Link>
          
            <Link to="/posts" className="flex flex-col items-center gap-1 w-full pt-2 pb-1">
            <LayoutList className={`h-5 w-5 ${isActive('/posts') ? 'text-cesar-cyan' : 'text-slate-400'}`} />
            <span className={`text-[10px] font-medium ${isActive('/posts') ? 'text-cesar-cyan' : 'text-slate-400'}`}>{t("nav.posts")}</span>
            {isActive('/posts') && <span className="h-1 w-1 rounded-full bg-cesar-cyan shadow-[0_0_8px_rgba(0,240,255,0.8)] mt-0.5"></span>}
          </Link>

          {isLoggedIn && (
            <Link to="/channel" className="flex flex-col items-center gap-1 w-full pt-2 pb-1">
              <Megaphone className={`h-5 w-5 ${isActive('/channel') ? 'text-cesar-cyan' : 'text-slate-400'}`} />
              <span className={`text-[10px] font-medium ${isActive('/channel') ? 'text-cesar-cyan' : 'text-slate-400'}`}>{t("nav.channel")}</span>
              {isActive('/channel') && <span className="h-1 w-1 rounded-full bg-cesar-cyan shadow-[0_0_8px_rgba(0,240,255,0.8)] mt-0.5"></span>}
            </Link>
          )}

          {isLoggedIn ? (
            <>
              {isAdmin && (
                <Link to="/admin/dashboard" className="flex flex-col items-center gap-1 w-full pt-2 pb-1">
                  <Shield className={`h-5 w-5 ${isActive('/admin/dashboard') ? 'text-cesar-cyan' : 'text-emerald-400'}`} />
                  <span className={`text-[10px] font-medium ${isActive('/admin/dashboard') ? 'text-cesar-cyan' : 'text-emerald-400'}`}>{t("nav.admin")}</span>
                  {isActive('/admin/dashboard') && <span className="h-1 w-1 rounded-full bg-cesar-cyan shadow-[0_0_8px_rgba(0,240,255,0.8)] mt-0.5"></span>}
                </Link>
              )}

              <Link to="/add-post" className="flex flex-col items-center gap-1 w-full pt-2 pb-1">
                <PlusSquare className={`h-5 w-5 ${isActive('/add-post') ? 'text-cesar-cyan' : 'text-slate-400'}`} />
                <span className={`text-[10px] font-medium ${isActive('/add-post') ? 'text-cesar-cyan' : 'text-slate-400'}`}>{t("nav.addPost")}</span>
                {isActive('/add-post') && <span className="h-1 w-1 rounded-full bg-cesar-cyan shadow-[0_0_8px_rgba(0,240,255,0.8)] mt-0.5"></span>}
              </Link>

              <Link to="/inbox" className="flex flex-col items-center gap-1 w-full pt-2 pb-1 relative">
                <div className="relative">
                  <MessageSquare className={`h-5 w-5 ${isActive('/inbox') ? 'text-cesar-cyan' : 'text-slate-400'}`} />
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-[9px] h-4 w-4 flex items-center justify-center rounded-full absolute -top-1 -right-2 font-bold animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-medium ${isActive('/inbox') ? 'text-cesar-cyan' : 'text-slate-400'}`}>{t("nav.inboxShort")}</span>
                {isActive('/inbox') && <span className="h-1 w-1 rounded-full bg-cesar-cyan shadow-[0_0_8px_rgba(0,240,255,0.8)] mt-0.5"></span>}
              </Link>

              <Link to="/profile" className="flex flex-col items-center gap-1 w-full pt-2 pb-1">
                <User className={`h-5 w-5 ${isActive('/profile') ? 'text-cesar-cyan' : 'text-slate-400'}`} />
                <span className={`text-[10px] font-medium ${isActive('/profile') ? 'text-cesar-cyan' : 'text-slate-400'}`}>{t("nav.profile")}</span>
                {isActive('/profile') && <span className="h-1 w-1 rounded-full bg-cesar-cyan shadow-[0_0_8px_rgba(0,240,255,0.8)] mt-0.5"></span>}
              </Link>

              <button onClick={handleLogout} className="flex flex-col items-center gap-1 w-full pt-2 pb-1">
                <LogOut className="h-5 w-5 text-red-500/80" />
                <span className="text-[10px] font-medium text-red-500/80">{t("nav.logoutShort")}</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="flex flex-col items-center gap-1 w-full pt-2 pb-1">
                <LogIn className={`h-5 w-5 ${isActive('/login') ? 'text-cesar-cyan' : 'text-slate-400'}`} />
                <span className={`text-[10px] font-medium ${isActive('/login') ? 'text-cesar-cyan' : 'text-slate-400'}`}>{t("nav.loginShort")}</span>
                {isActive('/login') && <span className="h-1 w-1 rounded-full bg-cesar-cyan shadow-[0_0_8px_rgba(0,240,255,0.8)] mt-0.5"></span>}
              </Link>

              <Link to="/register" className="flex flex-col items-center gap-1 w-full pt-2 pb-1">
                <UserPlus className={`h-5 w-5 ${isActive('/register') ? 'text-cesar-cyan' : 'text-slate-400'}`} />
                <span className={`text-[10px] font-medium ${isActive('/register') ? 'text-cesar-cyan' : 'text-slate-400'}`}>{t("nav.registerShort")}</span>
                {isActive('/register') && <span className="h-1 w-1 rounded-full bg-cesar-cyan shadow-[0_0_8px_rgba(0,240,255,0.8)] mt-0.5"></span>}
              </Link>
            </>
          )}

        </div>
      </nav>
      )}

      {!isChatRoute && <FloatingWarning />}
    </div>
    </div>
  );
}

export default MainLayout;