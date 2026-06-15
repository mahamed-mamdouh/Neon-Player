import { Component, ErrorInfo, ReactNode } from "react";
import frameNoBackground from "../assets/nature/frame_no_backround.png";
import minimizeButton from "../assets/nature/minimize_button.png";
import closeButton from "../assets/nature/close_button.png";

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
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div 
          className="player" 
          style={{ 
            height: '100%', 
            width: '100%', 
            position: 'relative',
            background: '#1d2b1a',
            fontFamily: 'Rainyhearts, monospace'
          }}
        >
          <img 
            src={frameNoBackground} 
            className="layer" 
            alt="" 
            draggable={false} 
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              zIndex: 2,
              pointerEvents: "none"
            }}
          />
          <div 
            className="window-title" 
            style={{
              position: "absolute",
              left: "calc((134 - 110) / 306 * 100vw)",
              top: "calc((51 - 23) / 306 * 100vw)",
              fontSize: "calc(15 / 306 * 100vw)",
              color: "#2b3d2f",
              zIndex: 50,
              pointerEvents: "none",
              userSelect: "none"
            }}
          >
            error logs
          </div>
          
          <img 
            src={minimizeButton} 
            className="layer layer-ui" 
            alt="" 
            draggable={false} 
            style={{
              position: "absolute",
              width: "calc(20 / 306 * 100vw)",
              height: "calc(21 / 306 * 100vw)",
              left: "calc((355 - 110) / 306 * 100vw)",
              top: "calc((48 - 23) / 306 * 100vw)",
              zIndex: 150
            }}
          />
          <img 
            src={closeButton} 
            className="layer layer-ui" 
            alt="" 
            draggable={false} 
            style={{
              position: "absolute",
              width: "calc(20 / 306 * 100vw)",
              height: "calc(21 / 306 * 100vw)",
              left: "calc((378 - 110) / 306 * 100vw)",
              top: "calc((48 - 23) / 306 * 100vw)",
              zIndex: 150
            }}
          />
          
          <div className="drag-region" data-tauri-drag-region />

          <div style={{
            position: 'absolute',
            top: '52%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            background: '#eefae5',
            border: '2px solid #2b3d2f',
            padding: '16px',
            borderRadius: '8px',
            color: '#2b3d2f',
            textAlign: 'center',
            zIndex: 100,
            boxShadow: '0 0 10px rgba(0,0,0,0.5)'
          }}>
            <h2 style={{ fontSize: '18px', margin: '0 0 8px 0', textTransform: 'uppercase' }}>system crash</h2>
            <p style={{ fontSize: '12px', color: '#3d5242', margin: '0 0 12px 0', lineHeight: '1.3', maxHeight: '120px', overflowY: 'auto', textAlign: 'left', whiteSpace: 'pre-wrap' }}>
              {this.state.error?.stack || this.state.error?.message || "An unexpected rendering error crashed the app."}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#2b3d2f',
                color: '#eefae5',
                border: 'none',
                padding: '6px 16px',
                borderRadius: '4px',
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
