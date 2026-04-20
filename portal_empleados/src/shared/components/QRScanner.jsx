// portal_empleados/src/shared/components/QRScanner.jsx
// Diseño inspirado en el scanner de iPhone:
//   - Visor cuadrado con esquinas blancas redondeadas
//   - Oscuridad real con recorte (clip-path) — no radial-gradient
//   - Flash verde al detectar QR válido
//   - Sin botón de inicio manual — si falla, alerta para llamar al supervisor

import { useEffect, useRef, useState } from "react";

export default function QRScanner({ tokenEsperado, onExito, onCerrar }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const [estado, setEstado] = useState("cargando"); // cargando | activo | exito | error
  const [msgError, setMsgError] = useState("");
  const [jsQR, setJsQR] = useState(null);

  // Carga dinámica de jsQR
  useEffect(() => {
    import("jsqr")
      .then((m) => setJsQR(() => m.default))
      .catch(() => {
        setEstado("error");
        setMsgError("No se pudo cargar el lector de QR.");
      });
  }, []);

  useEffect(() => {
    if (!jsQR) return;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        streamRef.current = stream;
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setEstado("activo");
        tick();
      } catch (e) {
        setEstado("error");
        setMsgError(
          e.name === "NotAllowedError"
            ? "Permiso de cámara denegado. Actívalo en Ajustes > Safari > Cámara."
            : "No se pudo acceder a la cámara.",
        );
      }
    };

    const tick = () => {
      rafRef.current = requestAnimationFrame(() => {
        const v = videoRef.current,
          c = canvasRef.current;
        if (!v || !c || v.readyState < v.HAVE_ENOUGH_DATA) {
          tick();
          return;
        }
        c.width = v.videoWidth;
        c.height = v.videoHeight;
        const ctx = c.getContext("2d");
        ctx.drawImage(v, 0, 0);
        const img = ctx.getImageData(0, 0, c.width, c.height);
        const code = jsQR(img.data, img.width, img.height, {
          inversionAttempts: "dontInvert",
        });
        if (code && code.data.trim() === tokenEsperado) {
          setEstado("exito");
          // Flash y luego callback
          setTimeout(() => onExito(code.data.trim()), 600);
          return;
        }
        tick();
      });
    };

    start();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [jsQR, tokenEsperado]);

  // Flash de éxito
  const exitoFlash = estado === "exito";

  // Visor: 260x260 centrado
  const VISOR = 260;
  const RADIO = 24; // border-radius del recorte

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "#000",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Barra superior estilo iOS */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          padding: "52px 20px 16px",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,.55) 0%, transparent 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={onCerrar}
          style={{
            background: "rgba(255,255,255,.15)",
            backdropFilter: "blur(8px)",
            border: "none",
            borderRadius: "20px",
            padding: "7px 16px",
            color: "#fff",
            fontSize: "15px",
            fontFamily: "'DM Sans',sans-serif",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <svg
            width="9"
            height="15"
            viewBox="0 0 9 16"
            fill="none"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="8,1 1,8 8,15" />
          </svg>
          Cancelar
        </button>
        <span
          style={{
            color: "#fff",
            fontSize: "16px",
            fontWeight: "600",
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
          Escanear QR
        </span>
        <div style={{ width: "80px" }} />
      </div>

      {/* Video fullscreen */}
      <video
        ref={videoRef}
        muted
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Overlay con recorte — igual que iPhone */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        <defs>
          <mask id="visor-mask">
            <rect width="100%" height="100%" fill="white" />
            {/* Recorte centrado */}
            <rect
              x={`calc(50% - ${VISOR / 2}px)`}
              y={`calc(50% - ${VISOR / 2}px)`}
              width={VISOR}
              height={VISOR}
              rx={RADIO}
              ry={RADIO}
              fill="black"
            />
          </mask>
        </defs>
        {/* Oscuridad alrededor */}
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.55)"
          mask="url(#visor-mask)"
        />
      </svg>

      {/* Marco del visor con esquinas iPhone */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          width: `${VISOR}px`,
          height: `${VISOR}px`,
          borderRadius: `${RADIO}px`,
          transition: "all .3s ease",
          boxShadow: exitoFlash
            ? "0 0 0 3px #22c55e, 0 0 60px rgba(34,197,94,.5)"
            : "0 0 0 2px rgba(255,255,255,.9)",
        }}
      >
        {/* Esquinas blancas estilo iPhone — 4 esquinas independientes */}
        {[
          {
            top: 0,
            left: 0,
            borderTop: "3px solid #fff",
            borderLeft: "3px solid #fff",
            borderTopLeftRadius: `${RADIO}px`,
          },
          {
            top: 0,
            right: 0,
            borderTop: "3px solid #fff",
            borderRight: "3px solid #fff",
            borderTopRightRadius: `${RADIO}px`,
          },
          {
            bottom: 0,
            left: 0,
            borderBottom: "3px solid #fff",
            borderLeft: "3px solid #fff",
            borderBottomLeftRadius: `${RADIO}px`,
          },
          {
            bottom: 0,
            right: 0,
            borderBottom: "3px solid #fff",
            borderRight: "3px solid #fff",
            borderBottomRightRadius: `${RADIO}px`,
          },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: "32px",
              height: "32px",
              ...s,
              transition: "border-color .3s",
              ...(exitoFlash ? { borderColor: "#22c55e" } : {}),
            }}
          />
        ))}

        {/* Línea de escaneo (solo cuando activo) */}
        {estado === "activo" && (
          <div
            style={{
              position: "absolute",
              left: "8px",
              right: "8px",
              height: "2px",
              borderRadius: "1px",
              background:
                "linear-gradient(90deg, transparent, #fff, transparent)",
              boxShadow: "0 0 8px rgba(255,255,255,.8)",
              animation: "scanline 2.4s ease-in-out infinite",
            }}
          />
        )}

        {/* Flash de éxito */}
        {exitoFlash && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: `${RADIO}px`,
              background: "rgba(34,197,94,.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
              <circle cx="26" cy="26" r="25" fill="rgba(34,197,94,.9)" />
              <polyline
                points="15,26 22,33 37,19"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Texto de estado — debajo del visor */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "0 24px 60px",
          background:
            "linear-gradient(to top, rgba(0,0,0,.65) 0%, transparent 100%)",
          textAlign: "center",
        }}
      >
        {estado === "cargando" && (
          <p
            style={{
              color: "rgba(255,255,255,.75)",
              fontSize: "15px",
              fontFamily: "'DM Sans',sans-serif",
              margin: 0,
            }}
          >
            Iniciando cámara...
          </p>
        )}
        {estado === "activo" && (
          <>
            <p
              style={{
                color: "#fff",
                fontSize: "15px",
                fontFamily: "'DM Sans',sans-serif",
                fontWeight: "500",
                margin: "0 0 8px",
              }}
            >
              Apunta al QR que muestra el supervisor
            </p>
            <p
              style={{
                color: "rgba(255,255,255,.55)",
                fontSize: "13px",
                fontFamily: "'DM Sans',sans-serif",
                margin: 0,
              }}
            >
              El QR se detecta automáticamente
            </p>
          </>
        )}
        {estado === "exito" && (
          <p
            style={{
              color: "#4ade80",
              fontSize: "16px",
              fontFamily: "'DM Sans',sans-serif",
              fontWeight: "600",
              margin: 0,
            }}
          >
            ✓ QR detectado correctamente
          </p>
        )}
        {estado === "error" && (
          <div
            style={{
              background: "rgba(15,15,15,.9)",
              backdropFilter: "blur(12px)",
              borderRadius: "20px",
              padding: "20px 24px",
              border: "1px solid rgba(255,255,255,.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginBottom: "10px",
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fca5a5"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p
                style={{
                  color: "#fca5a5",
                  fontSize: "14px",
                  fontFamily: "'DM Sans',sans-serif",
                  fontWeight: "600",
                  margin: 0,
                }}
              >
                {msgError}
              </p>
            </div>
            {/* Alerta supervisor — no hay botón manual */}
            <div
              style={{
                background: "rgba(251,191,36,.1)",
                border: "1px solid rgba(251,191,36,.3)",
                borderRadius: "12px",
                padding: "12px 14px",
                marginTop: "8px",
              }}
            >
              <p
                style={{
                  color: "#fbbf24",
                  fontSize: "13px",
                  fontFamily: "'DM Sans',sans-serif",
                  margin: "0 0 3px",
                  fontWeight: "600",
                }}
              >
                ¿El scanner no funciona?
              </p>
              <p
                style={{
                  color: "rgba(251,191,36,.8)",
                  fontSize: "12px",
                  fontFamily: "'DM Sans',sans-serif",
                  margin: 0,
                  lineHeight: "1.5",
                }}
              >
                Comunícate con el supervisor para que registre tu turno
                manualmente desde el panel de control.
              </p>
            </div>
            <button
              onClick={onCerrar}
              style={{
                marginTop: "14px",
                width: "100%",
                padding: "12px",
                borderRadius: "14px",
                background: "rgba(255,255,255,.1)",
                border: "1px solid rgba(255,255,255,.15)",
                color: "#fff",
                fontSize: "14px",
                fontFamily: "'DM Sans',sans-serif",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              Cerrar
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scanline {
          0%   { top: 12px;   opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: ${VISOR - 14}px; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
