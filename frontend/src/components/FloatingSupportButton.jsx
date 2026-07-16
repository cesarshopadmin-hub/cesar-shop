import { useNavigate, useLocation } from "react-router-dom";
import { Headset } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

const HIDDEN_PATHS = ["/admin", "/chat", "/inbox", "/profile", "/channel"];

const FloatingSupportButton = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const adminId = import.meta.env.VITE_ADMIN_ID;

  // Resolve the actual user object (handles nested shape)
  const currentUser = user?.name ? user : user?.user;

  // ── Visibility Rules ──────────────────────────────────────────────────────

  // Hide for the admin themselves
  if (currentUser?._id === adminId) return null;

  // Hide on clutter-prone pages
  if (HIDDEN_PATHS.some((p) => location.pathname.startsWith(p))) return null;

  // ── Click Handler ─────────────────────────────────────────────────────────

  const handleClick = () => {
    if (!currentUser) {
      toast.error("يرجى تسجيل الدخول للتواصل مع الدعم");
      navigate("/login");
      return;
    }
    navigate(`/chat/${adminId}`);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <button
      onClick={handleClick}
      aria-label="تواصل مع الدعم"
      dir="rtl"
      className="
        fixed z-40
        right-4 bottom-20
        md:right-6 md:bottom-6
        flex items-center gap-2
        px-4 py-2.5 rounded-full
        bg-cesar-darker/90 border border-cesar-cyan/50
        text-cesar-cyan font-cairo font-bold
        text-xs md:text-sm
        shadow-[0_0_15px_rgba(0,229,255,0.2)]
        hover:bg-cesar-dark/95 hover:shadow-[0_0_25px_rgba(0,229,255,0.4)] hover:scale-105
        active:scale-95
        backdrop-blur-md
        transition-all duration-300 ease-out
      "
    >
      {/* Icon with pulse — subtle attention signal without distracting the whole button */}
      <Headset className="h-4 w-4 shrink-0 animate-pulse" style={{ animationDuration: "2.5s" }} />
      <span>تواصل مع الدعم</span>
    </button>
  );
};

export default FloatingSupportButton;
