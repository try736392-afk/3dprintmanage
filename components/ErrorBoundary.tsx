
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Explicitly inherit from Component to ensure properties like setState and props are correctly resolved by TypeScript
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // Fix: setState is inherited from React.Component
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-xl shadow-xl max-w-2xl w-full border border-red-200">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle className="w-8 h-8" />
              <h1 className="text-2xl font-bold">程序发生错误</h1>
            </div>
            <p className="text-gray-700 mb-4">很抱歉，应用程序在渲染时遇到问题。</p>
            
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto text-sm font-mono mb-4">
              <p className="font-bold text-red-400 mb-2">{this.state.error?.toString()}</p>
              <pre className="whitespace-pre-wrap text-xs text-gray-400">
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              重新加载页面
            </button>
          </div>
        </div>
      );
    }

    // Fix: props is inherited from React.Component
    return this.props.children;
  }
}

export default ErrorBoundary;
