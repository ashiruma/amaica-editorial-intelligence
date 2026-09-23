import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import PublicHome from "./pages/public/Home";
import PublicArticle from "./pages/public/Article";
import LegendPage from "./pages/public/Legend";
import StyleGuide from "./pages/public/StyleGuide";
import EditorialPolicy from "./pages/public/EditorialPolicy";
import AuthPage from "./pages/Auth";
import OAuthConsent from "./pages/OAuthConsent";
import Discover from "./pages/newsroom/Discover";
import DraftsList from "./pages/newsroom/DraftsList";
import DraftEditor from "./pages/newsroom/DraftEditor";
import Published from "./pages/newsroom/Published";
import Admin from "./pages/newsroom/Admin";
import ScrapeHealth from "./pages/newsroom/ScrapeHealth";
import NewsroomLegends from "./pages/newsroom/Legends";
import DiscoveryAdmin from "./pages/newsroom/DiscoveryAdmin";
import AiDetectorStudio from "./pages/newsroom/AiDetectorStudio";
import NewsroomAuth from "./pages/NewsroomAuth";
import { RequireNewsroomAuth } from "@/components/auth/RequireNewsroomAuth";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicHome />} />
          <Route path="/category/:category" element={<PublicHome />} />
          <Route path="/article/:id" element={<PublicArticle />} />
          <Route path="/legends/:id" element={<LegendPage />} />
          <Route path="/editorial-policy" element={<Navigate to="/newsroom/editorial-policy" replace />} />
          <Route path="/style-guide" element={<Navigate to="/newsroom/style-guide" replace />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/newsroom/auth" element={<NewsroomAuth />} />
          <Route path="/newsroom/login" element={<NewsroomAuth />} />
          <Route path="/newsroom/signup" element={<NewsroomAuth />} />
          <Route path="/~oauth/initiate" element={<Navigate to="/auth" replace />} />
          <Route path="/oauth/consent" element={<OAuthConsent />} />
          <Route path="/newsroom" element={<RequireNewsroomAuth><Discover /></RequireNewsroomAuth>} />
          <Route path="/newsroom/drafts" element={<RequireNewsroomAuth><DraftsList /></RequireNewsroomAuth>} />
          <Route path="/newsroom/draft/:id" element={<RequireNewsroomAuth><DraftEditor /></RequireNewsroomAuth>} />
          <Route path="/newsroom/published" element={<RequireNewsroomAuth><Published /></RequireNewsroomAuth>} />
          <Route path="/newsroom/admin" element={<RequireNewsroomAuth requireAdmin><Admin /></RequireNewsroomAuth>} />
          <Route path="/newsroom/health" element={<RequireNewsroomAuth><ScrapeHealth /></RequireNewsroomAuth>} />
          <Route path="/newsroom/legends" element={<RequireNewsroomAuth><NewsroomLegends /></RequireNewsroomAuth>} />
          <Route path="/newsroom/discovery" element={<RequireNewsroomAuth><DiscoveryAdmin /></RequireNewsroomAuth>} />
          <Route path="/newsroom/detector" element={<RequireNewsroomAuth><AiDetectorStudio /></RequireNewsroomAuth>} />
          <Route path="/newsroom/ai-detector" element={<RequireNewsroomAuth><AiDetectorStudio /></RequireNewsroomAuth>} />
          <Route path="/newsroom/editorial-policy" element={<RequireNewsroomAuth><EditorialPolicy /></RequireNewsroomAuth>} />
          <Route path="/newsroom/style-guide" element={<RequireNewsroomAuth><StyleGuide /></RequireNewsroomAuth>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
