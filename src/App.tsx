
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import React from "react";
import SacoreMinimal from "@/components/SacoreMinimal";
import { Layout } from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import SearchPage from "@/pages/SearchPage";
import LinkedInAnalysisPage from "@/pages/LinkedInAnalysisPage";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import LinkedInBooleanSearchComponent from "@/components/LinkedInBooleanSearchComponent";
import { SheetView } from "./pages/SheetView";
import { ProjectView } from "./pages/ProjectView";
import { ProjectsView } from "./pages/ProjectsView";
import LinkedInGoogleExtractorPage from "./pages/LinkedInGoogleExtractorPage";
import TestPage from "./pages/TestPage";
import LinkedInSearchPage from "./pages/LinkedInSearchPage";
import LinkedInConnectPage from "./pages/LinkedInConnectPage";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Error caught in ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="max-w-md p-8 bg-gray-900 rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold mb-4">Något gick fel</h1>
            <p className="mb-4">Det uppstod ett problem när sidan skulle visas.</p>
            <div className="mb-4 p-3 bg-red-900/30 rounded overflow-auto text-xs">
              {this.state.error?.toString() || "Okänt fel"}
            </div>
            <button 
              className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded"
              onClick={() => window.location.href = '/'}
            >
              Gå till startsidan
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => {
  const queryClient = new QueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<SacoreMinimal />} />
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/search" element={<Layout><SearchPage /></Layout>} />
          <Route path="/linkedin-analysis" element={<Layout><LinkedInAnalysisPage /></Layout>} />
          <Route path="/linkedin-search" element={<LinkedInSearchPage />} />
          <Route path="/linkedin-connect" element={<LinkedInConnectPage />} />
          <Route path="/boolean-search" element={<Layout><LinkedInBooleanSearchComponent /></Layout>} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/sheet-view" element={
            <ErrorBoundary>
              <SheetView />
            </ErrorBoundary>
          } />
          <Route path="/project/:projectId" element={
            <ErrorBoundary>
              <ProjectView />
            </ErrorBoundary>
          } />
          <Route path="/projects" element={
            <ErrorBoundary>
              <ProjectsView />
            </ErrorBoundary>
          } />
          <Route path="/linkedin-extractor" element={<Layout><LinkedInGoogleExtractorPage /></Layout>} />
          <Route path="/test" element={<TestPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
