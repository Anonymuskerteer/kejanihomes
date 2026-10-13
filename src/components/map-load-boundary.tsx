import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  height: number | string;
}

interface State {
  failed: boolean;
}

export class MapLoadBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Map failed to load:", error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return (
        <div
          role="alert"
          className="grid place-items-center gap-3 rounded-2xl border border-border bg-muted p-4 text-center text-sm text-muted-foreground"
          style={{ height: this.props.height }}
        >
          <p>The map couldn't load. Check your connection and try again.</p>
          <button
            type="button"
            className="font-medium text-primary underline"
            onClick={() => window.location.reload()}
          >
            Reload map
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
