// portal_empleados/src/shared/components/QRScanner.jsx
//
// Estrategia dual:
//   HTTPS / localhost → getUserMedia (cámara en vivo, experiencia iPhone)
//   HTTP             → <input capture="environment"> (abre cámara nativa, decodifica la foto con jsQR)

import { useEffect, useRef, useState, useCallback } from "react";

const VISOR = 260;
const RADIO = 24;

export default function QRScanner({ tokenEsperado, onExito, onCerrar }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const jsqrRef = useRef(null);
  const trackRef = useRef(null);
  const fileRef = useRef(null); // input file para fallback HTTP

  // idle | requesting | active | success | denied | error | file_mode
  const [fase, setFase] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [linterna, setLinterna] = useState(false);
  const [hayLinterna, setHayLinterna] = useState(false);

  // ── Cargar jsQR ────────────────────────────────────────────────────────
  useEffect(() => {
    import("jsqr").then((m) => {
      jsqrRef.current = m.default;
    });
  }, []);

  // ── Helpers linterna ───────────────────────────────────────────────────
  const apagar = useCallback(() => {
    try {
      trackRef.current?.applyConstraints({ advanced: [{ torch: false }] });
    } catch (_) {}
    setLinterna(false);
  }, []);

  const toggleLinterna = useCallback(async () => {
    const track = trackRef.current;
    if (!track) return;
    try {
      const next = !linterna;
      await track.applyConstraints({ advanced: [{ torch: next }] });
      setLinterna(next);
    } catch (e) {
      console.warn("Torch:", e);
    }
  }, [linterna]);

  // ── Loop de escaneo en vivo ────────────────────────────────────────────
  const startScan = useCallback(() => {
    const loop = () => {
      const video = videoRef.current,
        canvas = canvasRef.current,
        jsqr = jsqrRef.current;
      if (
        !video ||
        !canvas ||
        !jsqr ||
        video.readyState < video.HAVE_ENOUGH_DATA
      ) {
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
        apagar();
        setTimeout(() => onExito(code.data.trim()), 700);
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [tokenEsperado, onExito, apagar]);

  // ── Decodificar foto (modo HTTP fallback) ──────────────────────────────
  const decodePhoto = useCallback(
    (file) => {
      if (!file) return;
      setFase("requesting"); // spinner mientras decodifica

      const jsqr = jsqrRef.current;
      if (!jsqr) {
        // jsQR aún no cargó — esperar y reintentar
        setTimeout(() => decodePhoto(file), 200);
        return;
      }

      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsqr(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "attemptBoth",
        });
        URL.revokeObjectURL(url);

        if (code && code.data.trim() === tokenEsperado) {
          setFase("success");
          setTimeout(() => onExito(code.data.trim()), 500);
        } else if (code) {
          // Se leyó un QR pero no coincide
          setFase("file_mode");
          setErrorMsg(
            "El QR escaneado no corresponde a este turno. Intenta de nuevo con el QR correcto.",
          );
        } else {
          // No se detectó QR en la imagen
          setFase("file_mode");
          setErrorMsg(
            "No se detectó ningún QR en la foto. Asegúrate de enfocar bien el código.",
          );
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        setFase("file_mode");
        setErrorMsg("No se pudo leer la imagen.");
      };
      img.src = url;
    },
    [tokenEsperado, onExito],
  );

  // ── Solicitar cámara ───────────────────────────────────────────────────
  const requestCamera = useCallback(async () => {
    setFase("requesting");
    setErrorMsg("");

    const isSecure =
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    // ── FALLBACK HTTP: usar input file con capture ──────────────────────
    if (!isSecure || !navigator.mediaDevices?.getUserMedia) {
      setFase("file_mode");
      return;
    }

    // ── MODO NORMAL: getUserMedia ───────────────────────────────────────
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      trackRef.current = track;
      if (track) {
        const caps = track.getCapabilities?.() ?? {};
        setHayLinterna(!!caps.torch);
      }
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      video.srcObject = stream;
      await video.play();
      setFase("active");
      startScan();
    } catch (err) {
      const n = err.name ?? "";
      if (n === "NotAllowedError" || n === "PermissionDeniedError") {
        setFase("denied");
        setErrorMsg(
          "iOS Safari: Ajustes → Safari → Cámara → Permitir\nChrome Android: toca 🔒 → Cámara → Permitir",
        );
      } else if (n === "NotFoundError") {
        setFase("error");
        setErrorMsg("No se encontró cámara.");
      } else {
        setFase("error");
        setErrorMsg(`Error: ${err.message || n}`);
      }
    }
  }, [startScan]);

  // ── Abrir cámara nativa (file input) ─────────────────────────────────
  const abrirCamaraNativa = useCallback(() => {
    setErrorMsg("");
    fileRef.current?.click();
  }, []);

  useEffect(() => {
    const t = setTimeout(requestCamera, 100);
    return () => clearTimeout(t);
  }, [requestCamera]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current)
        streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const exitoFlash = fase === "success";
  const mostrarVisor = fase === "active" || fase === "success";
  const sinCamara = !mostrarVisor;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "#000",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'DM Sans',system-ui,sans-serif",
      }}
    >
      {/* ── Video en vivo ── */}
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

      {/* ── Input file oculto — abre cámara nativa del celular ── */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ""; // reset para permitir re-escaneo
          decodePhoto(file);
        }}
      />

      {/* ── Overlay oscuro ── */}
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

      {/* ── Marco visor iPhone ── */}
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
              ? "0 0 0 3px #22c55e,0 0 60px rgba(34,197,94,.4)"
              : "0 0 0 1.5px rgba(255,255,255,.8)",
            transition: "box-shadow .3s",
          }}
        >
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
                ...(exitoFlash ? { borderColor: "#22c55e" } : {}),
              }}
            />
          ))}
          {fase === "active" && (
            <div
              style={{
                position: "absolute",
                left: "10px",
                right: "10px",
                height: "2px",
                background:
                  "linear-gradient(90deg,transparent,rgba(255,255,255,.9),transparent)",
                boxShadow: "0 0 10px rgba(255,255,255,.6)",
                animation: "scanline 2.4s ease-in-out infinite",
              }}
            />
          )}
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

      {/* ── Header ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          paddingTop: "max(env(safe-area-inset-top,44px),44px)",
          padding: "max(env(safe-area-inset-top,44px),44px) 20px 16px",
          background:
            "linear-gradient(to bottom,rgba(0,0,0,.7) 0%,transparent 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={() => {
            apagar();
            onCerrar();
          }}
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
            fontFamily: "'DM Sans',sans-serif",
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

        {fase === "active" && hayLinterna ? (
          <button
            onClick={toggleLinterna}
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              background: linterna ? "#fbbf24" : "rgba(255,255,255,.15)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: linterna
                ? "2px solid #f59e0b"
                : "1px solid rgba(255,255,255,.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all .2s",
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={linterna ? "#78350f" : "#fff"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2" />
            </svg>
          </button>
        ) : (
          <div style={{ width: "42px" }} />
        )}
      </div>

      {/* ── Instrucción modo activo ── */}
      {fase === "active" && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "0 24px max(env(safe-area-inset-bottom,24px),48px)",
            background:
              "linear-gradient(to top,rgba(0,0,0,.7) 0%,transparent 100%)",
            textAlign: "center",
          }}
        >
          {hayLinterna && (
            <p
              style={{
                color: "rgba(255,255,255,.4)",
                fontSize: "12px",
                margin: "0 0 4px",
              }}
            >
              ⚡ Toca el rayo para la linterna
            </p>
          )}
          <p
            style={{
              color: "#fff",
              fontSize: "15px",
              fontWeight: "500",
              margin: "0 0 4px",
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

      {/* ── Estados sin cámara en vivo ── */}
      {sinCamara && (
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
          {/* Spinner */}
          {(fase === "idle" || fase === "requesting") && (
            <div style={{ textAlign: "center" }}>
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
                  fontWeight: "500",
                  margin: "0 0 6px",
                }}
              >
                {fase === "idle" ? "Preparando..." : "Procesando imagen..."}
              </p>
            </div>
          )}

          {/* ── MODO HTTP: cámara nativa ── */}
          {fase === "file_mode" && (
            <div
              style={{
                width: "100%",
                maxWidth: "340px",
                background: "rgba(15,15,15,.97)",
                borderRadius: "28px",
                padding: "32px 24px",
                border: "1px solid rgba(255,255,255,.1)",
                textAlign: "center",
              }}
            >
              {/* Ícono cámara */}
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "22px",
                  background: "rgba(35,83,71,.2)",
                  border: `1px solid rgba(35,83,71,.4)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#8EB69B"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>

              <p
                style={{
                  color: "#fff",
                  fontSize: "19px",
                  fontWeight: "700",
                  margin: "0 0 8px",
                  fontFamily: "'Playfair Display',serif",
                }}
              >
                Escanear QR
              </p>
              <p
                style={{
                  color: "rgba(255,255,255,.5)",
                  fontSize: "13px",
                  lineHeight: "1.6",
                  margin: "0 0 24px",
                }}
              >
                Toca el botón para abrir la cámara y fotografía el QR que
                muestra el supervisor.
              </p>

              {/* Mensaje de error si el QR no coincidió */}
              {errorMsg && (
                <div
                  style={{
                    background: "rgba(239,68,68,.1)",
                    border: "1px solid rgba(248,113,113,.25)",
                    borderRadius: "14px",
                    padding: "12px 14px",
                    marginBottom: "18px",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#f87171"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ flexShrink: 0, marginTop: "1px" }}
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p
                    style={{
                      color: "#fca5a5",
                      fontSize: "13px",
                      margin: 0,
                      lineHeight: "1.5",
                    }}
                  >
                    {errorMsg}
                  </p>
                </div>
              )}

              {/* Botón principal — abre cámara nativa */}
              <button
                onClick={abrirCamaraNativa}
                style={{
                  width: "100%",
                  padding: "18px",
                  borderRadius: "18px",
                  border: "none",
                  background: "#235347",
                  color: "#fff",
                  fontSize: "16px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  boxShadow: "0 4px 20px rgba(35,83,71,.4)",
                  fontFamily: "'DM Sans',sans-serif",
                  marginBottom: "12px",
                  transition: "opacity .15s",
                  active: "opacity:.8",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                Abrir cámara
              </button>

              {/* Aviso supervisor */}
              <div
                style={{
                  background: "rgba(251,191,36,.07)",
                  border: "1px solid rgba(251,191,36,.2)",
                  borderRadius: "14px",
                  padding: "12px 14px",
                }}
              >
                <p
                  style={{
                    color: "#fbbf24",
                    fontSize: "12px",
                    fontWeight: "700",
                    margin: "0 0 3px",
                  }}
                >
                  ¿El QR no funciona?
                </p>
                <p
                  style={{
                    color: "rgba(251,191,36,.7)",
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

          {/* Permiso denegado */}
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
                  margin: "0 0 8px",
                }}
              >
                Permiso denegado
              </p>
              <p
                style={{
                  color: "rgba(255,255,255,.6)",
                  fontSize: "13px",
                  lineHeight: "1.6",
                  margin: "0 0 18px",
                  whiteSpace: "pre-line",
                }}
              >
                {errorMsg}
              </p>
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
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                Intentar de nuevo
              </button>
              <button
                onClick={() => setFase("file_mode")}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,.07)",
                  border: "1px solid rgba(255,255,255,.1)",
                  color: "rgba(255,255,255,.6)",
                  fontSize: "13px",
                  cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                Usar cámara nativa en su lugar
              </button>
            </div>
          )}

          {/* Error genérico */}
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
                  margin: "0 0 18px",
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
                  background: "rgba(255,255,255,.1)",
                  border: "1px solid rgba(255,255,255,.15)",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  marginBottom: "10px",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                Reintentar
              </button>
              <button
                onClick={() => setFase("file_mode")}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "14px",
                  background: "rgba(255,255,255,.07)",
                  border: "1px solid rgba(255,255,255,.1)",
                  color: "rgba(255,255,255,.6)",
                  fontSize: "13px",
                  cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                Usar cámara nativa
              </button>
            </div>
          )}

          {/* Éxito */}
          {fase === "success" && (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  background: "rgba(34,197,94,.9)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <svg width="34" height="34" viewBox="0 0 52 52" fill="none">
                  <polyline
                    points="12,26 22,36 40,18"
                    stroke="white"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p
                style={{
                  color: "#4ade80",
                  fontSize: "18px",
                  fontWeight: "700",
                  margin: 0,
                }}
              >
                ¡QR detectado!
              </p>
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
