import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import MainLayout from "./components/layout/MainLayout.jsx";
import HomePage from "./pages/HomePage.jsx";
// import MarketplacePage from "./pages/MarketplacePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import AddPostPage from "./pages/AddPostPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.jsx"; // الدشبورد الجديدة
import AdminSettingsPage from "./pages/admin/AdminSettingsPage.jsx";
import AddAdminPage from "./pages/admin/AddAdminPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import EditPostPage from "./pages/EditPostPage.jsx";
import PostsPage from "./pages/PostsPage.jsx";
import PostDetailsPage from "./pages/PostDetailsPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import InboxPage from "./pages/InboxPage.jsx";
import CesarChannelPage from "./pages/CesarChannelPage.jsx";
import FloatingSupportButton from "./components/FloatingSupportButton.jsx";

// Import Guards
import GuestGuard from "./components/guards/GuestGuard.jsx";
import AuthGuard from "./components/guards/AuthGuard.jsx";
import AdminGuard from "./components/guards/AdminGuard.jsx";
// import LanguageSwitcher from "./components/LanguageSwitcher.jsx";
import useApp from "./context/useApp";

function App() {
  const { settings } = useApp();

  // Dynamic favicon — updates whenever the admin changes the logo with circular crop
  useEffect(() => {
    const favicon = document.querySelector("link[rel~='icon']");
    if (!favicon) return;

    if (settings?.logoUrl) {
      const img = new Image();
      img.crossOrigin = "Anonymous"; // ضروري عشان نتفادى خطأ الـ CORS من Cloudinary

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext("2d");

        // رسم دائرة لقص الصورة
        ctx.beginPath();
        ctx.arc(32, 32, 32, 0, Math.PI * 2);
        ctx.clip();

        // رسم الصورة داخل الدائرة
        ctx.drawImage(img, 0, 0, 64, 64);

        // تحويل النتيجة لـ Favicon
        favicon.href = canvas.toDataURL("image/png");
      };

      // لو حصل أي مشكلة في تحميل الصورة، نرجع للوجو الافتراضي
      img.onerror = () => {
        favicon.href = "/favicon.png";
      };

      img.src = settings.logoUrl;
    } else {
      favicon.href = "/favicon.png";
    }
  }, [settings?.logoUrl]);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            {/* 🟢 Public Routes (Ay 7d yshofha) */}
            <Route path="/" element={<HomePage />} />
            <Route path="/posts" element={<PostsPage />} />

            {/* 🟡 Guest Routes (L-ly msh 3aml login bs) */}
            <Route
              path="/login"
              element={
                <GuestGuard>
                  <LoginPage />
                </GuestGuard>
              }
            />
            <Route
              path="/register"
              element={
                <GuestGuard>
                  <RegisterPage />
                </GuestGuard>
              }
            />
            <Route path="/posts/:id" element={<PostDetailsPage />} />

            {/* 🔴 Auth Routes (L-ly 3aml login bs) */}
            <Route
              path="/profile"
              element={
                <AuthGuard>
                  <ProfilePage />
                </AuthGuard>
              }
            />
            <Route
              path="/profile/:id"
              element={
                <AuthGuard>
                  <ProfilePage />
                </AuthGuard>
              }
            />
            <Route
              path="/inbox"
              element={
                <AuthGuard>
                  <InboxPage />
                </AuthGuard>
              }
            />
            <Route
              path="/add-post"
              element={
                <AuthGuard>
                  <AddPostPage />
                </AuthGuard>
              }
            />
            <Route
              path="/chat/:id"
              element={
                <AuthGuard>
                  <ChatPage />
                </AuthGuard>
              }
            />
            <Route path="/channel" element={<CesarChannelPage />} />

            {/* 👑 Admin Routes (Ll-moderen bs) */}
            <Route
              path="/admin/dashboard"
              element={
                <AdminGuard>
                  <AdminDashboardPage />
                </AdminGuard>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <AdminGuard>
                  <AdminSettingsPage />
                </AdminGuard>
              }
            />
            <Route
              path="/admin/add-admin"
              element={
                <AdminGuard>
                  <AddAdminPage />
                </AdminGuard>
              }
            />
            <Route
              path="/edit-post/:id"
              element={
                <AuthGuard>
                  <EditPostPage />
                </AuthGuard>
              }
            />

            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {/* Global floating support button — hidden on admin/chat/inbox/profile */}
        <FloatingSupportButton />
        {/* <LanguageSwitcher /> */}
        <ToastContainer position="top-right" autoClose={2500} theme="dark" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
