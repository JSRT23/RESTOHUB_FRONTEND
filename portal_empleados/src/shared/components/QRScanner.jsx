// portal_empleados/src/shared/components/QRScanner.jsx
// Scanner QR estilo iPhone.
// IMPORTANTE: solicita permiso de cámara de forma explícita (requerido en iOS Safari).
// Estados: idle → requesting → active → success | denied | error

import { useEffect, useRef, useState, useCallback } from "react";

const VISOR = 260;
const RADIO = 24;

export default function QRScanner({ tokenEsperado, onExito, onCerrar }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const jsqrRef = useRef(null);

  // Estados: idle | requesting | active | success | denied | error
  const [fase, setFase] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // ── Cargar jsQR una sola vez ──────────────────────────────────────────
  useEffect(() => {
    import("jsqr").then((m) => {
      jsqrRef.current = m.default;
    });
  }, []);

  // ── Loop de escaneo ───────────────────────────────────────────────────
  const startScan = useCallback(() => {
    const loop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const jsqr = jsqrRef.current;
      if (!video || !canvas || !jsqr) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      if (video.readyState < video.HAVE_ENOUGH_DATA) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0);

      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsqr(img.data, img.width, img.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data.trim() === tokenEsperado) {
        setFase("success");
        setTimeout(() => onExito(code.data.trim()), 700);
        return; // no seguir escaneando
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [tokenEsperado, onExito]);

  // ── Solicitar cámara ──────────────────────────────────────────────────
  const requestCamera = useCallback(async () => {
    setFase("requesting");
    setErrorMsg("");

    try {
      // Preferir cámara trasera en mobile, cualquiera en desktop
      const constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      video.srcObject = stream;

      // En iOS Safari es obligatorio llamar play() después de asignar srcObject
      await video.play();

      setFase("active");
      startScan();
    } catch (err) {
      const name = err.name ?? "";

      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setFase("denied");
        setErrorMsg(
          "Permiso de cámara denegado.\n\n" +
            "iOS Safari: Ajustes > Safari > Cámara → Permitir\n" +
            "Chrome Android: toca el 🔒 en la barra de URL → Cámara → Permitir",
        );
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setFase("error");
        setErrorMsg("No se encontró cámara en este dispositivo.");
      } else if (name === "NotReadableError" || name === "TrackStartError") {
        setFase("error");
        setErrorMsg(
          "La cámara está siendo usada por otra aplicación. Ciérrala e intenta de nuevo.",
        );
      } else {
        setFase("error");
        setErrorMsg(`No se pudo abrir la cámara: ${err.message || name}`);
      }
    }
  }, [startScan]);

  // ── Auto-iniciar al montar ─────────────────────────────────────────────
  useEffect(() => {
    // Pequeño delay para que el DOM esté listo (importante en iOS)
    const t = setTimeout(() => requestCamera(), 100);
    return () => clearTimeout(t);
  }, [requestCamera]);

  // ── Cleanup al desmontar ──────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current)
        streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const exitoFlash = fase === "success";
  const mostrarVisor = fase === "active" || fase === "success";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "#000",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      {/* ── Video fullscreen ── */}
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: mostrarVisor ? 1 : 0,
          transition: "opacity .3s",
        }}
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* ── Overlay oscuro con recorte (solo cuando hay cámara) ── */}
      {mostrarVisor && (
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
            <mask id="qr-mask">
              <rect width="100%" height="100%" fill="white" />
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
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,.6)"
            mask="url(#qr-mask)"
          />
        </svg>
      )}

      {/* ── Marco del visor (esquinas iPhone) ── */}
      {mostrarVisor && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: `${VISOR}px`,
            height: `${VISOR}px`,
            borderRadius: `${RADIO}px`,
            boxShadow: exitoFlash
              ? "0 0 0 3px #22c55e, 0 0 60px rgba(34,197,94,.4)"
              : "0 0 0 1.5px rgba(255,255,255,.8)",
            transition: "box-shadow .3s ease",
          }}
        >
          {/* 4 esquinas independientes */}
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

          {/* Línea de escaneo */}
          {fase === "active" && (
            <div
              style={{
                position: "absolute",
                left: "10px",
                right: "10px",
                height: "2px",
                borderRadius: "1px",
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,.9), transparent)",
                boxShadow: "0 0 10px rgba(255,255,255,.6)",
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
                background: "rgba(34,197,94,.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "rgba(34,197,94,.9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="26" height="26" viewBox="0 0 52 52" fill="none">
                  <polyline
                    points="12,26 22,36 40,18"
                    stroke="white"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Header con botón Cancelar ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          padding: "env(safe-area-inset-top, 44px) 20px 16px",
          paddingTop: "max(env(safe-area-inset-top, 44px), 44px)",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,.7) 0%, transparent 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={onCerrar}
          style={{
            background: "rgba(255,255,255,.15)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "none",
            borderRadius: "22px",
            padding: "8px 18px",
            color: "#fff",
            fontSize: "15px",
            fontWeight: "500",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "7px",
            fontFamily: "'DM Sans', sans-serif",
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
        <span style={{ color: "#fff", fontSize: "16px", fontWeight: "600" }}>
          Escanear QR
        </span>
        <div style={{ width: "80px" }} />
      </div>

      {/* ── Texto instructivo debajo del visor ── */}
      {fase === "active" && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "0 24px max(env(safe-area-inset-bottom, 24px), 48px)",
            background:
              "linear-gradient(to top, rgba(0,0,0,.7) 0%, transparent 100%)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              color: "#fff",
              fontSize: "15px",
              fontWeight: "500",
              margin: "0 0 6px",
            }}
          >
            Apunta al QR del supervisor
          </p>
          <p
            style={{
              color: "rgba(255,255,255,.45)",
              fontSize: "13px",
              margin: 0,
            }}
          >
            Se detecta automáticamente
          </p>
        </div>
      )}

      {/* ── Estados sin cámara: centro de pantalla ── */}
      {(fase === "idle" ||
        fase === "requesting" ||
        fase === "denied" ||
        fase === "error") && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "32px 28px",
          }}
        >
          {(fase === "idle" || fase === "requesting") && (
            <div style={{ textAlign: "center" }}>
              {/* Spinner */}
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  border: "3px solid rgba(255,255,255,.15)",
                  borderTopColor: "rgba(255,255,255,.8)",
                  borderRadius: "50%",
                  margin: "0 auto 20px",
                  animation: "spin .8s linear infinite",
                }}
              />
              <p
                style={{
                  color: "rgba(255,255,255,.8)",
                  fontSize: "16px",
                  margin: "0 0 6px",
                  fontWeight: "500",
                }}
              >
                {fase === "idle"
                  ? "Preparando cámara..."
                  : "Solicitando acceso a la cámara..."}
              </p>
              <p
                style={{
                  color: "rgba(255,255,255,.35)",
                  fontSize: "13px",
                  margin: 0,
                }}
              >
                {fase === "requesting" &&
                  "Acepta el permiso cuando el navegador lo solicite"}
              </p>
            </div>
          )}

          {fase === "denied" && (
            <div
              style={{
                width: "100%",
                maxWidth: "340px",
                background: "rgba(10,10,10,.95)",
                borderRadius: "24px",
                padding: "28px 24px",
                border: "1px solid rgba(251,191,36,.25)",
                textAlign: "center",
              }}
            >
              {/* Ícono candado */}
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "18px",
                  background: "rgba(251,191,36,.12)",
                  border: "1px solid rgba(251,191,36,.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="3" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>

              <p
                style={{
                  color: "#fbbf24",
                  fontSize: "17px",
                  fontWeight: "700",
                  margin: "0 0 10px",
                }}
              >
                Acceso a cámara requerido
              </p>

              <p
                style={{
                  color: "rgba(255,255,255,.6)",
                  fontSize: "13px",
                  lineHeight: "1.6",
                  margin: "0 0 20px",
                  whiteSpace: "pre-line",
                }}
              >
                {errorMsg}
              </p>

              {/* Botón reintentar */}
              <button
                onClick={requestCamera}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "14px",
                  border: "none",
                  background: "#fbbf24",
                  color: "#000",
                  fontSize: "15px",
                  fontWeight: "700",
                  cursor: "pointer",
                  marginBottom: "10px",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Intentar de nuevo
              </button>

              {/* Aviso supervisor */}
              <div
                style={{
                  background: "rgba(255,255,255,.04)",
                  border: "1px solid rgba(255,255,255,.08)",
                  borderRadius: "12px",
                  padding: "12px",
                }}
              >
                <p
                  style={{
                    color: "#fbbf24",
                    fontSize: "13px",
                    fontWeight: "700",
                    margin: "0 0 3px",
                  }}
                >
                  ¿No puedes activar el permiso?
                </p>
                <p
                  style={{
                    color: "rgba(255,255,255,.45)",
                    fontSize: "12px",
                    margin: 0,
                    lineHeight: "1.5",
                  }}
                >
                  Comunícate con el supervisor para que registre tu turno
                  manualmente.
                </p>
              </div>
            </div>
          )}

          {fase === "error" && (
            <div
              style={{
                width: "100%",
                maxWidth: "340px",
                background: "rgba(10,10,10,.95)",
                borderRadius: "24px",
                padding: "28px 24px",
                border: "1px solid rgba(248,113,113,.2)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "18px",
                  background: "rgba(239,68,68,.12)",
                  border: "1px solid rgba(248,113,113,.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f87171"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <p
                style={{
                  color: "#f87171",
                  fontSize: "16px",
                  fontWeight: "700",
                  margin: "0 0 8px",
                }}
              >
                Error de cámara
              </p>
              <p
                style={{
                  color: "rgba(255,255,255,.55)",
                  fontSize: "13px",
                  lineHeight: "1.6",
                  margin: "0 0 20px",
                }}
              >
                {errorMsg}
              </p>
              <button
                onClick={requestCamera}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: "14px",
                  border: "none",
                  background: "rgba(255,255,255,.1)",
                  border: "1px solid rgba(255,255,255,.15)",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  marginBottom: "10px",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Reintentar
              </button>
              <button
                onClick={onCerrar}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "14px",
                  border: "none",
                  background: "transparent",
                  color: "rgba(255,255,255,.4)",
                  fontSize: "14px",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes scanline {
          0%   { top: 12px; opacity: 0; }
          8%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { top: ${VISOR - 14}px; opacity: 0; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
