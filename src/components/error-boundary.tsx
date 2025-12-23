"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center animate-in fade-in duration-300">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
                    <p className="text-muted-foreground mb-4 max-w-md">
                        An unexpected error occurred. Please try again or refresh the page.
                    </p>
                    {process.env.NODE_ENV === "development" && this.state.error && (
                        <pre className="text-xs text-left bg-muted p-4 rounded-md mb-4 max-w-md overflow-auto">
                            {this.state.error.message}
                        </pre>
                    )}
                    <div className="flex gap-2">
                        <Button onClick={this.handleReset} variant="outline">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                        </Button>
                        <Button onClick={() => window.location.reload()}>
                            Refresh Page
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Functional wrapper for easier use
function withErrorBoundary<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    fallback?: ReactNode
) {
    return function WithErrorBoundary(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <WrappedComponent {...props} />
            </ErrorBoundary>
        );
    };
}

export { ErrorBoundary, withErrorBoundary };
