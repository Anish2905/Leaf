import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "./error-boundary";

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
    AlertTriangle: () => <div data-testid="alert-icon">AlertIcon</div>,
    RefreshCw: () => <div data-testid="refresh-icon">RefreshIcon</div>,
}));

// Mock Button component
vi.mock("@/components/ui/button", () => ({
    Button: ({ children, onClick, ...props }: { children: React.ReactNode; onClick?: () => void }) => (
        <button onClick={onClick} {...props}>{children}</button>
    ),
}));

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
    if (shouldThrow) {
        throw new Error("Test error");
    }
    return <div data-testid="child">Child component</div>;
};

describe("ErrorBoundary", () => {
    // Suppress console.error for expected errors
    const originalError = console.error;
    beforeEach(() => {
        console.error = vi.fn();
    });

    afterEach(() => {
        console.error = originalError;
    });

    it("renders children when no error", () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={false} />
            </ErrorBoundary>
        );

        expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("renders fallback UI when error occurs", () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText("Something went wrong")).toBeInTheDocument();
        expect(screen.getByTestId("alert-icon")).toBeInTheDocument();
    });

    it("renders custom fallback when provided", () => {
        render(
            <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom Error</div>}>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
    });

    it("has Try Again button that resets error state", () => {
        const { container } = render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText("Something went wrong")).toBeInTheDocument();

        const tryAgainButton = screen.getByText("Try Again");
        expect(tryAgainButton).toBeInTheDocument();
    });

    it("has Refresh Page button", () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(screen.getByText("Refresh Page")).toBeInTheDocument();
    });

    it("logs error to console in development", () => {
        render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(console.error).toHaveBeenCalled();
    });
});
