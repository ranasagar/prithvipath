import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import EditorDashboard from "./pages/EditorDashboard";
import AdminEditor from "./pages/AdminEditor";
import AdminUsers from "./pages/AdminUsers";
import AdminSettings from "./pages/AdminSettings";
import AdminCategories from "./pages/AdminCategories";
import AdminAds from "./pages/AdminAds";
import AdminSetupGuide from "./pages/AdminSetupGuide";
import CategoryPage from "./pages/CategoryPage";
import ArticlePage from "./pages/ArticlePage";
import DistrictPage from "./pages/DistrictPage";
import LivePage from "./pages/LivePage";
import AdminArticles from "./pages/AdminArticles";
import SearchPage from "./pages/SearchPage";
import TrendingPage from "./pages/TrendingPage";
import LatestNewsPage from "./pages/LatestNewsPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import ProfilePage from "./pages/ProfilePage";
import TermsPage from "./pages/TermsPage";
import ChautariPage from "./pages/ChautariPage";
import ChautariPostPage from "./pages/ChautariPostPage";
import AdminYouTube from "./pages/AdminYouTube";
import VideoHub from "./pages/VideoHub";
import PrivacyPage from "./pages/PrivacyPage";
import { AuthProvider } from "./lib/auth";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ScrollToTop from "./components/layout/ScrollToTop";
import ScrollProgress from "./components/ui/ScrollProgress";

import { useLocation } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import CinematicTransition from "./components/layout/CinematicTransition";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes key={location.pathname} location={location}>
        <Route path="/" element={<CinematicTransition><HomePage /></CinematicTransition>} />
        <Route path="/login" element={<CinematicTransition><LoginPage /></CinematicTransition>} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CinematicTransition><AdminDashboard /></CinematicTransition>
          </ProtectedRoute>
        } />
        
        {/* Editor Routes */}
        <Route path="/editor" element={
          <ProtectedRoute allowedRoles={['editor']}>
            <CinematicTransition><EditorDashboard /></CinematicTransition>
          </ProtectedRoute>
        } />

        {/* Shared Admin/Editor Routes */}
        <Route path="/admin/articles" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <CinematicTransition><AdminArticles /></CinematicTransition>
          </ProtectedRoute>
        } />
        <Route path="/admin/editor" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <CinematicTransition><AdminEditor /></CinematicTransition>
          </ProtectedRoute>
        } />
        <Route path="/admin/editor/:id" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <CinematicTransition><AdminEditor /></CinematicTransition>
          </ProtectedRoute>
        } />
        <Route path="/admin/youtube" element={
          <ProtectedRoute allowedRoles={['admin', 'editor']}>
            <CinematicTransition><AdminYouTube /></CinematicTransition>
          </ProtectedRoute>
        } />

        {/* Admin Only Specific Routes */}
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CinematicTransition><AdminUsers /></CinematicTransition>
          </ProtectedRoute>
        } />
        <Route path="/admin/settings" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CinematicTransition><AdminSettings /></CinematicTransition>
          </ProtectedRoute>
        } />
        <Route path="/admin/categories" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CinematicTransition><AdminCategories /></CinematicTransition>
          </ProtectedRoute>
        } />
        <Route path="/admin/ads" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CinematicTransition><AdminAds /></CinematicTransition>
          </ProtectedRoute>
        } />
        <Route path="/admin/setup-guide" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CinematicTransition><AdminSetupGuide /></CinematicTransition>
          </ProtectedRoute>
        } />

        <Route path="/category/:slug" element={<CinematicTransition><CategoryPage /></CinematicTransition>} />
        <Route path="/article/:id" element={<CinematicTransition><ArticlePage /></CinematicTransition>} />
        <Route path="/district/:districtName" element={<CinematicTransition><DistrictPage /></CinematicTransition>} />
        <Route path="/search" element={<CinematicTransition><SearchPage /></CinematicTransition>} />
        <Route path="/trending" element={<CinematicTransition><TrendingPage /></CinematicTransition>} />
        <Route path="/latest" element={<CinematicTransition><LatestNewsPage /></CinematicTransition>} />
        <Route path="/live" element={<CinematicTransition><LivePage /></CinematicTransition>} />
        <Route path="/videos" element={<CinematicTransition><VideoHub /></CinematicTransition>} />
        <Route path="/about" element={<CinematicTransition><AboutPage /></CinematicTransition>} />
        <Route path="/contact" element={<CinematicTransition><ContactPage /></CinematicTransition>} />
        <Route path="/profile/:uid" element={<CinematicTransition><ProfilePage /></CinematicTransition>} />
        <Route path="/terms" element={<CinematicTransition><TermsPage /></CinematicTransition>} />
        <Route path="/chautari" element={<CinematicTransition><ChautariPage /></CinematicTransition>} />
        <Route path="/chautari/post/:id" element={<CinematicTransition><ChautariPostPage /></CinematicTransition>} />
        <Route path="/privacy" element={<CinematicTransition><PrivacyPage /></CinematicTransition>} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollProgress />
        <ScrollToTop />
        <AnimatedRoutes />
      </Router>

    </AuthProvider>
  );
}
