import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  theme?: string;
  assets?: any;
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
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const isBlue = this.props.theme === 'blue';
      const frameAsset = this.props.assets?.frame || "";
      const exitAsset = this.props.assets?.exitButton || "";
      const minimizerAsset = this.props.assets?.minimizerButton || "";

      return (
        <div className={`player ${isBlue ? 'theme-blue' : ''}`} style={{ height: '100%', width: '100%', position: 'relative' }}>
          {frameAsset && <img src={frameAsset} className="layer" alt="" draggable={false} />}
          <div className="window-title">error logs</div>
          
          {minimizerAsset && <img src={minimizerAsset} className="layer layer-ui minimizer-layer" alt="" draggable={false} />}
          {exitAsset && <img src={exitAsset} className="layer layer-ui" alt="" draggable={false} />}
          
          <div className="drag-region" data-tauri-drag-region />

          <div style={{
            position: 'absolute',
            top: '52%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            background: '#2b2229',
            border: '2px solid #ff4e6a',
            padding: '16px',
            borderRadius: '4px',
            fontFamily: 'Rainyhearts, monospace',
            color: '#ff4e6a',
            textAlign: 'center',
            zIndex: 100,
            boxShadow: '0 0 10px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 8px 0', textTransform: 'uppercase' }}>system crash</h2>
            <p style={{ fontSize: '10px', color: '#ffacb7', margin: '0 0 12px 0', lineHeight: '1.3', maxHeight: '120px', overflowY: 'auto', textAlign: 'left', whiteSpace: 'pre-wrap' }}>
              {this.state.error?.stack || this.state.error?.message || "An unexpected rendering error crashed the app."}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#ff4e6a',
                color: '#2b2229',
                border: 'none',
                padding: '6px 16px',
                borderRadius: '2px',
                fontFamily: 'inherit',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              restart app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
