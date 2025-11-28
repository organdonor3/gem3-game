import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

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
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/90 text-white z-[100] p-8">
                    <h1 className="text-4xl font-bold mb-4">Oops! Something went wrong.</h1>
                    <p className="text-xl mb-8 text-red-200">The game crashed. Don't worry, it happens.</p>

                    <div className="bg-black/50 p-4 rounded-lg mb-8 max-w-2xl overflow-auto max-h-64 w-full">
                        <code className="text-sm font-mono text-red-300">
                            {this.state.error?.toString()}
                        </code>
                    </div>

                    <button
                        className="px-8 py-4 bg-white text-red-900 font-bold rounded-xl hover:bg-gray-200 transition-all"
                        onClick={() => window.location.reload()}
                    >
                        RELOAD GAME
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
