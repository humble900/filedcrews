import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-6">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Something went wrong</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            We encountered an unexpected error. Our team has been notified.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => window.location.reload()}
              className="gap-2 font-bold"
            >
              <RefreshCw className="h-4 w-4" /> Reload Page
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = "/"}
              className="font-bold"
            >
              Return Home
            </Button>
          </div>
          {this.state.error && (
            <div className="mt-8 p-4 bg-red-50 text-red-900 rounded-lg text-left text-xs font-mono max-w-2xl overflow-auto w-full border border-red-200">
              {this.state.error.toString()}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
