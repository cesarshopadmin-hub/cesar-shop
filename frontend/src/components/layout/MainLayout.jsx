import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, LayoutList, PlusSquare, User, LogIn, UserPlus, LogOut, Shield } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import CesarLogo from "../CesarLogo";
// import ParticleBackground from "./ParticleBackground";

function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, logout, user } = useAuth(); 

  const isActive = (path) => location.pathname === path;
  const isLoggedIn = !!token; 
  
  const currentUser = user?.name ? user : user?.user;
  const isAdmin = currentUser?.role === "admin";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-cesar-darker text-white font-cairo pb-16 md:pb-0 relative" dir="rtl">
    
    {/* <ParticleBackground />  */}

    <div className="relative z-10"> 
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            
            <div className="flex items-center gap-2">
              <Link to="/" className="flex items-center gap-3 text-xl font-black tracking-wide text-cesar-cyan drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">
                <CesarLogo className="w-14 h-14" />
                <span>متجر سيزار</span>
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link to="/" className={`transition hover:text-cesar-cyan ${isActive('/') ? 'text-cesar-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : 'text-slate-300'}`}>الرئيسية</Link>
              <Link to="/posts" className={`transition hover:text-cesar-cyan ${isActive('/posts') ? 'text-cesar-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : 'text-slate-300'}`}>المنشورات</Link>
              
              {isLoggedIn ? (
                <>
                  <Link to="/add-post" className={`transition hover:text-cesar-cyan ${isActive('/add-post') ? 'text-cesar-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : 'text-slate-300'}`}>أضف إعلان</Link>
                  <Link to="/profile" className={`transition hover:text-cesar-cyan ${isActive('/profile') ? 'text-cesar-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : 'text-slate-300'}`}>حسابي</Link>
                  
                  {isAdmin && (
                    <Link to="/admin/dashboard" className={`transition hover:text-cesar-cyan flex items-center gap-1 ${isActive('/admin/dashboard') ? 'text-cesar-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : 'text-emerald-400'}`}>
                      <Shield className="h-4 w-4" /> الإدارة
                    </Link>
                  )}

                  <button onClick={handleLogout} className="flex items-center gap-1 text-red-400 transition hover:text-red-300 hover:drop-shadow-[0_0_8px_rgba(248,113,113,0.6)]">
                    <LogOut className="h-4 w-4" /> تسجيل خروج
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className={`transition hover:text-cesar-cyan ${isActive('/login') ? 'text-cesar-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : 'text-slate-300'}`}>تسجيل الدخول</Link>
                  <Link to="/register" className="rounded-full border border-cesar-cyan/30 bg-cesar-cyan/10 px-4 py-1.5 text-cesar-cyan transition hover:bg-cesar-cyan/20 hover:shadow-neon-cyan">
                    إنشاء حساب
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

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-[#0a0f16]/95 backdrop-blur-lg">
        <div className="flex justify-around items-center h-16">
          
          <Link to="/" className="flex flex-col items-center gap-1 w-full pt-2 pb-1">
            <Home className={`h-5 w-5 ${isActive('/') ? 'text-cesar-cyan' : 'text-slate-400'}`} />
            <span className={`text-[10px] font-medium ${isActive('/') ? 'text-cesar-cyan' : 'text-slate-400'}`}>الرئيسية</span>
            {isActive('/') && <span className="h-1 w-1 rounded-full bg-cesar-cyan shadow-[0_0_8px_rgba(0,240,255,0.8)] mt-0.5"></span>}
          </Link>
          
          <Link to="/posts" className="flex flex-col items-center gap-1 w-full pt-2 pb-1">
            <LayoutList className={`h-5 w-5 ${isActive('/posts') ? 'text-cesar-cyan' : 'text-slate-400'}`} />
            <span className={`text-[10px] font-medium ${isActive('/posts') ? 'text-cesar-cyan' : 'text-slate-400'}`}>المنشورات</span>
            {isActive('/posts') && <span className="h-1 w-1 rounded-full bg-cesar-cyan shadow-[0_0_8px_rgba(0,240,255,0.8)] mt-0.5"></span>}
          </Link>

          {isLoggedIn ? (
            <>
              {isAdmin && (
                <Link to="/admin/dashboard" className="flex flex-col items-center gap-1 w-full pt-2 pb-1">
                  <Shield className={`h-5 w-5 ${isActive('/admin/dashboard') ? 'text-cesar-cyan' : 'text-emerald-400'}`} />
                  <span className={`text-[10px] font-medium ${isActive('/admin/dashboard') ? 'text-cesar-cyan' : 'text-emerald-400'}`}>الإدارة</span>
                  {isActive('/admin/dashboard') && <span className="h-1 w-1 rounded-full bg-cesar-cyan shadow-[0_0_8px_rgba(0,240,255,0.8)] mt-0.5"></span>}
                </Link>
              )}

              <Link to="/add-post" className="flex flex-col items-center gap-1 w-full pt-2 pb-1">
                <PlusSquare className={`h-5 w-5 ${isActive('/add-post') ? 'text-cesar-cyan' : 'text-slate-400'}`} />
                <span className={`text-[10px] font-medium ${isActive('/add-post') ? 'text-cesar-cyan' : 'text-slate-400'}`}>أضف إعلان</span>
                {isActive('/add-post') && <span className="h-1 w-1 rounded-full bg-cesar-cyan shadow-[0_0_8px_rgba(0,240,255,0.8)] mt-0.5"></span>}
              </Link>

              <Link to="/profile" className="flex flex-col items-center gap-1 w-full pt-2 pb-1">
                <User className={`h-5 w-5 ${isActive('/profile') ? 'text-cesar-cyan' : 'text-slate-400'}`} />
                <span className={`text-[10px] font-medium ${isActive('/profile') ? 'text-cesar-cyan' : 'text-slate-400'}`}>حسابي</span>
                {isActive('/profile') && <span className="h-1 w-1 rounded-full bg-cesar-cyan shadow-[0_0_8px_rgba(0,240,255,0.8)] mt-0.5"></span>}
              </Link>

              <button onClick={handleLogout} className="flex flex-col items-center gap-1 w-full pt-2 pb-1">
                <LogOut className="h-5 w-5 text-red-500/80" />
                <span className="text-[10px] font-medium text-red-500/80">خروج</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="flex flex-col items-center gap-1 w-full pt-2 pb-1">
                <LogIn className={`h-5 w-5 ${isActive('/login') ? 'text-cesar-cyan' : 'text-slate-400'}`} />
                <span className={`text-[10px] font-medium ${isActive('/login') ? 'text-cesar-cyan' : 'text-slate-400'}`}>دخول</span>
                {isActive('/login') && <span className="h-1 w-1 rounded-full bg-cesar-cyan shadow-[0_0_8px_rgba(0,240,255,0.8)] mt-0.5"></span>}
              </Link>

              <Link to="/register" className="flex flex-col items-center gap-1 w-full pt-2 pb-1">
                <UserPlus className={`h-5 w-5 ${isActive('/register') ? 'text-cesar-cyan' : 'text-slate-400'}`} />
                <span className={`text-[10px] font-medium ${isActive('/register') ? 'text-cesar-cyan' : 'text-slate-400'}`}>حساب جديد</span>
                {isActive('/register') && <span className="h-1 w-1 rounded-full bg-cesar-cyan shadow-[0_0_8px_rgba(0,240,255,0.8)] mt-0.5"></span>}
              </Link>
            </>
          )}

        </div>
      </nav>

    </div>
    </div>
  );
}

export default MainLayout;