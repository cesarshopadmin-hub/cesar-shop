import { Link, Outlet, useLocation } from "react-router-dom";
import { Home, LayoutList, PlusSquare, User } from "lucide-react";

function MainLayout() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-cesar-darker text-white font-cairo pb-16 md:pb-0" dir="rtl">
      
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            
            <div className="flex items-center gap-2">
              <Link to="/" className="text-xl font-black tracking-wide text-cesar-cyan drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]">
                متجر سيزار 👑
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link to="/" className={`transition hover:text-cesar-cyan ${isActive('/') ? 'text-cesar-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : 'text-slate-300'}`}>الرئيسية</Link>
              <Link to="/posts" className={`transition hover:text-cesar-cyan ${isActive('/posts') ? 'text-cesar-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : 'text-slate-300'}`}>المنشورات</Link>
              <Link to="/add-post" className={`transition hover:text-cesar-cyan ${isActive('/add-post') ? 'text-cesar-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : 'text-slate-300'}`}>أضف إعلان</Link>
              <Link to="/profile" className={`transition hover:text-cesar-cyan ${isActive('/profile') ? 'text-cesar-cyan drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]' : 'text-slate-300'}`}>حسابي</Link>
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

        </div>
      </nav>

    </div>
  );
}

export default MainLayout;