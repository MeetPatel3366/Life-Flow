import { Component } from "react";
import { HiExclamationCircle, HiRefresh } from "react-icons/hi";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[60vh] p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <HiExclamationCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-surface-900 mb-2">Something went wrong</h2>
            <p className="text-surface-500 text-sm mb-6">
              An unexpected error occurred. Please try again or contact support if the problem persists.
            </p>
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors cursor-pointer"
            >
              <HiRefresh className="w-4 h-4" />
              Try Again
            </button>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-surface-400 cursor-pointer hover:text-surface-600">
                  Technical details
                </summary>
                <pre className="mt-2 p-3 bg-surface-50 rounded-lg text-xs text-red-700 overflow-auto max-h-40">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
