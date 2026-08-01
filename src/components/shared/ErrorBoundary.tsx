import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallbackMessage?: string;
  onReportError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    console.error("[PRODUCTION ERROR BOUNDARY]", error, errorInfo);
    
    // Centralized production error reporting callback
    if (this.props.onReportError) {
      try {
        this.props.onReportError(error, errorInfo);
      } catch (reportingErr) {
        console.error("Failed to execute error reporting callback:", reportingErr);
      }
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReloadPage = () => {
    window.location.reload();
  };

  handleNavigateHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 m-4 rounded-lg bg-red-950/40 border border-red-800/60 text-red-200 flex flex-col items-center justify-center text-center space-y-4 shadow-xl">
          <AlertTriangle className="w-12 h-12 text-red-400 animate-pulse" />
          <div>
            <h3 className="font-bold text-lg text-white">Application Exception Caught</h3>
            <p className="text-sm text-red-300/80 max-w-md mt-1">
              {this.props.fallbackMessage || this.state.error?.message || "An unexpected rendering error occurred."}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={this.handleRetry} className="border-red-700 text-red-200 hover:bg-red-900/60 gap-1.5">
              <RefreshCw className="w-4 h-4" /> Try Component Reset
            </Button>
            <Button variant="outline" size="sm" onClick={this.handleReloadPage} className="border-red-700 text-red-200 hover:bg-red-900/60 gap-1.5">
              <RefreshCw className="w-4 h-4" /> Reload Page
            </Button>
            <Button variant="secondary" size="sm" onClick={this.handleNavigateHome} className="bg-slate-800 text-slate-200 hover:bg-slate-700 gap-1.5">
              <Home className="w-4 h-4" /> Return to Dashboard
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
