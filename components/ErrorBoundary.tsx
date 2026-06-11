"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Last line of defence: a render error on either screen shows a reload
 * button instead of killing the party with a blank page.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
          <h1 className="text-3xl font-black">Something broke</h1>
          <p className="max-w-md font-mono text-sm text-parch-500">
            {this.state.error.message}
          </p>
          <p className="max-w-md text-parch-400">
            Reloading rejoins the game where it was — stats and story survive
            a refresh.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-amber-500 px-10 py-4 text-xl font-bold text-night hover:bg-amber-400"
          >
            Reload
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
