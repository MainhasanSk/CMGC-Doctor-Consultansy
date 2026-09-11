import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
          <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-4 ring-red-100">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-slate-900">
              Something went wrong
            </h2>
            <p className="mt-2 text-xs text-slate-500">
              An unexpected display error occurred while rendering this page.
            </p>
            {this.state.error?.message && (
              <div className="mt-4 rounded-lg bg-slate-50 p-3 font-mono text-[11px] text-red-600 text-left overflow-x-auto border border-slate-200">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cmgc-primary px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-cmgc-navy transition"
            >
              <RotateCcw className="h-4 w-4" /> Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
