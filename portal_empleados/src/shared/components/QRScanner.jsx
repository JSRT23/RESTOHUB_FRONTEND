// portal_empleados/src/shared/components/QRScanner.jsx  v3
//
// Estrategia:
//   HTTPS/localhost → getUserMedia en vivo (visor iPhone, linterna)
//   HTTP mobile     → abre la app de cámara/escáner nativo del celular
//                     vía <input accept="image/*"> sin capture,
//                     lo que en iOS muestra "Tomar foto / Escáner QR / Elegir archivo"
//                     y en Android abre la galería con opción de cámara
//                     — el usuario usa el escáner QR nativo y la imagen resultante
//                     se decodifica con jsQR

import { useEffect, useRef, useState, useCallback } from "react";
import Swal from "sweetalert2";

const VISOR = 260;
const RADIO = 24;

export default function QRScanner({ tokenEsperado, onExito, onCerrar }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const jsqrRef = useRef(null);
  const trackRef = useRef(null);
  const fileRef = useRef(null);

  const [fase, setFase] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [linterna, setLinterna] = useState(false);
  const [hayLinterna, setHayLinterna] = useState(false);

  useEffect(() => {
    import("jsqr").then((m) => {
      jsqrRef.current = m.default;
    });
  }, []);

  const apagar = useCallback(() => {
    try {
      trackRef.current?.applyConstraints({ advanced: [{ torch: false }] });
    } catch (_) {}
    setLinterna(false);
  }, []);

  const toggleLinterna = useCallback(async () => {
    if (!trackRef.current) return;
    try {
      const next = !linterna;
      await trackRef.current.applyConstraints({ advanced: [{ torch: next }] });
      setLinterna(next);
    } catch (_) {}
  }, [linterna]);

  // ── Loop en vivo (modo HTTPS) ──────────────────────────────────────────
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

  // ── Decodificar imagen — cámara, galería, archivos ───────────────────
  // Maneja: JPEG, PNG, WebP, HEIC (iOS convierte a JPEG al subir),
  //         fotos rotadas (EXIF), imágenes grandes, inversión de colores.
  const decodeImage = useCallback(
    (file) => {
      if (!file) return;
      setFase("decoding");
      setErrorMsg("");

      // Esperar a que jsQR esté cargado
      const waitJsqr = (tries = 0) => {
        if (!jsqrRef.current) {
          if (tries > 30) {
            setFase("native");
            Swal.fire({
              background: "#fff",
              icon: "error",
              title: "QR no válido",
              text: "No se pudo cargar el lector. Recarga la página.",
              confirmButtonColor: "#235347",
            });
            return;
          }
          setTimeout(() => waitJsqr(tries + 1), 150);
          return;
        }
        processar();
      };

      const processar = () => {
        const jsqr = jsqrRef.current;
        const url = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
          URL.revokeObjectURL(url);

          // Escalar a máximo 2000px manteniendo proporción
          // (fotos de galería pueden ser 4000x3000 — jsQR es lento con eso)
          const MAX = 2000;
          const ratio = Math.min(1, MAX / Math.max(img.width, img.height));
          const w = Math.round(img.width * ratio);
          const h = Math.round(img.height * ratio);

          // Intentar 4 variantes: normal, invertido, rotado 90°, rotado 270°
          // Cubre fotos tomadas en landscape o con orientación EXIF ignorada
          const intentos = [
            () => dibujar(img, w, h, 0),
            () => dibujar(img, w, h, 90),
            () => dibujar(img, w, h, 270),
            () => dibujar(img, w, h, 180),
          ];

          let code = null;
          for (const intento of intentos) {
            const imageData = intento();
            code =
              jsqr(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
              }) ||
              jsqr(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "onlyInvert",
              }) ||
              jsqr(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "attemptBoth",
              });
            if (code) break;
          }

          if (!code) {
            setFase("native");
            Swal.fire({
              background: "#fff",
              icon: "warning",
              title: "QR no válido",
              text: "No se detectó ningún código QR en la imagen. Asegúrate de que el QR sea visible y bien enfocado.",
              confirmButtonColor: "#235347",
              confirmButtonText: "Intentar de nuevo",
            });
            return;
          }

          const tokenLeido = code.data.trim();

          if (tokenLeido === tokenEsperado) {
            setFase("success");
            setTimeout(() => onExito(tokenLeido), 500);
          } else {
            setFase("native");
            Swal.fire({
              background: "#fff",
              icon: "error",
              title: "QR no válido",
              text: "El código QR no corresponde a tu turno. Asegúrate de escanear el QR correcto del supervisor.",
              confirmButtonColor: "#235347",
              confirmButtonText: "Intentar de nuevo",
            });
          }
        };

        img.onerror = () => {
          URL.revokeObjectURL(url);
          // Último recurso: leer como blob y convertir via FileReader
          const reader = new FileReader();
          reader.onload = (ev) => {
            const img2 = new Image();
            img2.onload = () => {
              // Reintentar con la imagen cargada desde base64
              const canvas = document.createElement("canvas");
              canvas.width = img2.width;
              canvas.height = img2.height;
              canvas.getContext("2d").drawImage(img2, 0, 0);
              const data = canvas
                .getContext("2d")
                .getImageData(0, 0, img2.width, img2.height);
              const code = jsqr(data.data, data.width, data.height, {
                inversionAttempts: "attemptBoth",
              });
              if (code && code.data.trim() === tokenEsperado) {
                setFase("success");
                setTimeout(() => onExito(code.data.trim()), 500);
              } else {
                setFase("native");
                Swal.fire({
                  background: "#fff",
                  icon: "error",
                  title: "QR no válido",
                  text: code
                    ? "El código QR no corresponde a tu turno."
                    : "No se pudo leer la imagen.",
                  confirmButtonColor: "#235347",
                  confirmButtonText: "Intentar de nuevo",
                });
              }
            };
            img2.onerror = () => {
              setFase("native");
              Swal.fire({
                background: "#fff",
                icon: "error",
                title: "QR no válido",
                text: "No se pudo leer la imagen. Intenta con otra foto.",
                confirmButtonColor: "#235347",
                confirmButtonText: "Intentar de nuevo",
              });
            };
            img2.src = ev.target.result;
          };
          reader.onerror = () => {
            setFase("native");
            Swal.fire({
              background: "#fff",
              icon: "error",
              title: "QR no válido",
              text: "No se pudo procesar el archivo.",
              confirmButtonColor: "#235347",
              confirmButtonText: "Intentar de nuevo",
            });
          };
          reader.readAsDataURL(file);
        };

        img.src = url;
      };

      // Dibujar imagen rotada en canvas y devolver ImageData
      const dibujar = (img, w, h, grados) => {
        const canvas = document.createElement("canvas");
        if (grados === 90 || grados === 270) {
          canvas.width = h;
          canvas.height = w;
        } else {
          canvas.width = w;
          canvas.height = h;
        }
        const ctx = canvas.getContext("2d");
        ctx.save();
        if (grados === 90) {
          ctx.translate(h, 0);
          ctx.rotate(Math.PI / 2);
        }
        if (grados === 180) {
          ctx.translate(w, h);
          ctx.rotate(Math.PI);
        }
        if (grados === 270) {
          ctx.translate(0, w);
          ctx.rotate(-Math.PI / 2);
        }
        ctx.drawImage(img, 0, 0, w, h);
        ctx.restore();
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
      };

      waitJsqr();
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

    // HTTP → modo nativo directamente
    if (!isSecure || !navigator.mediaDevices?.getUserMedia) {
      setFase("native");
      return;
    }

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
        // Permiso denegado → ofrecer modo nativo
        setFase("native");
        setErrorMsg(
          "Permiso de cámara denegado. Usa el escáner nativo de tu celular:",
        );
      } else {
        setFase("native");
        setErrorMsg(`Cámara no disponible: ${err.message || n}`);
      }
    }
  }, [startScan]);

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
      {/* Input file — sin capture para que iOS muestre "Escáner QR" en el menú */}
      {/* Oculto con opacity:0 en vez de display:none para compatibilidad Android */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "1px",
          height: "1px",
          opacity: 0,
          zIndex: -1,
        }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ""; // reset para poder re-escanear
          if (file) decodeImage(file);
        }}
      />

      {/* Video en vivo */}
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

      {/* Overlay oscuro con recorte */}
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

      {/* Marco iPhone */}
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

      {/* Header */}
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

      {/* Instrucción modo activo */}
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

      {/* Estados sin cámara en vivo */}
      {!mostrarVisor && (
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
          {(fase === "idle" ||
            fase === "requesting" ||
            fase === "decoding") && (
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
                  margin: 0,
                }}
              >
                {fase === "decoding" ? "Leyendo QR..." : "Iniciando..."}
              </p>
            </div>
          )}

          {/* ── MODO NATIVO ─────────────────────────────────────────────── */}
          {fase === "native" && (
            <div
              style={{
                width: "100%",
                maxWidth: "340px",
                background: "rgba(15,15,15,.97)",
                borderRadius: "28px",
                padding: "32px 24px",
                border: "1px solid rgba(255,255,255,.08)",
                textAlign: "center",
              }}
            >
              {/* Ícono QR */}
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "22px",
                  background: "rgba(35,83,71,.2)",
                  border: "1.5px solid rgba(35,83,71,.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <svg
                  width="38"
                  height="38"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#8EB69B"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <path d="M14 14h.01M14 17h3M17 14v3M21 21h-3v-3M21 17h-1" />
                </svg>
              </div>

              <h2
                style={{
                  color: "#fff",
                  fontSize: "20px",
                  fontWeight: "700",
                  margin: "0 0 8px",
                  fontFamily: "'Playfair Display',serif",
                }}
              >
                Escanear QR
              </h2>

              <p
                style={{
                  color: "rgba(255,255,255,.5)",
                  fontSize: "13px",
                  lineHeight: "1.6",
                  margin: "0 0 6px",
                }}
              >
                Toca el botón para abrir la cámara de tu celular.
              </p>
              <p
                style={{
                  color: "rgba(255,255,255,.35)",
                  fontSize: "12px",
                  lineHeight: "1.5",
                  margin: "0 0 24px",
                }}
              >
                <strong style={{ color: "rgba(255,255,255,.5)" }}>iOS:</strong>{" "}
                elige "Escanear código QR" en el menú.{"\n"}
                <strong style={{ color: "rgba(255,255,255,.5)" }}>
                  Android:
                </strong>{" "}
                apunta al QR y toca "Tomar foto".
              </p>

              {/* BOTÓN PRINCIPAL */}
              <button
                onClick={() => {
                  setErrorMsg("");
                  fileRef.current?.click();
                }}
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
                  boxShadow: "0 4px 24px rgba(35,83,71,.45)",
                  fontFamily: "'DM Sans',sans-serif",
                  marginBottom: "12px",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.8"
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
                  border: "1px solid rgba(251,191,36,.18)",
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
                  ¿No funciona?
                </p>
                <p
                  style={{
                    color: "rgba(251,191,36,.65)",
                    fontSize: "12px",
                    margin: 0,
                    lineHeight: "1.5",
                  }}
                >
                  Dile al supervisor que registre tu turno manualmente desde el
                  panel de control.
                </p>
              </div>
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
          8%   { opacity: 1; } 92% { opacity: 1; }
          100% { top: ${VISOR - 14}px; opacity: 0; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
