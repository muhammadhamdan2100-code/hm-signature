import { Component, type ErrorInfo, type ReactNode } from "react";
import { captureError } from "../lib/observability";
import { useI18n } from "../i18n/I18nProvider";

// Phase 10-J: a render crash must become observable rather than a blank white page. The class
// boundary captures the error; the fallback is a function component so it can reuse the already
// translated `common.*` copy (no new dictionary keys, six-language parity kept).
function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6" role="alert">
      <p className="font-mono uppercase tracking-widest text-xs text-muted">{t("common.errorCode")}</p>
      <h1 className="font-serif text-2xl mt-3">{t("common.notFoundTitle")}</h1>
      <p className="text-sm text-muted mt-2 max-w-md leading-relaxed">{t("common.notFoundBody")}</p>
      <div className="flex gap-3 mt-6">
        <button onClick={onRetry} className="px-4 py-2 border border-current text-xs uppercase tracking-wider">
          {t("common.retry")}
        </button>
        <a href="/" className="px-4 py-2 bg-black text-white text-xs uppercase tracking-wider">
          {t("common.returnHome")}
        </a>
      </div>
    </div>
  );
}

type Props = { children: ReactNode };
type State = { hasError: boolean };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    captureError(error, { event: "react.error_boundary", componentStack: info.componentStack || undefined });
  }

  private reset = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (this.state.hasError) return <ErrorFallback onRetry={this.reset} />;
    return this.props.children;
  }
}
