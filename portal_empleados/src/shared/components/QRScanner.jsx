// portal_empleados/src/shared/components/QRScanner.jsx  v6
//
// Estrategia unificada:
//   1. Siempre intenta getUserMedia primero (funciona en PC aunque sea HTTP)
//   2. Si getUserMedia falla por contexto inseguro (celular con HTTP)
//      → muestra botón nativo (input file) para tomar/subir foto
//   3. Si falla por permiso denegado → pantalla de permiso + fallback subir foto
//
// Resultado: PC/tablet → visor en vivo siempre
//            Celular HTTP → botón cámara nativa
//            Celular HTTPS → visor en vivo

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

  // idle | requesting | active | success | denied | native | decoding
  const [fase, setFase] = useState("idle");
  const [linterna, setLinterna] = useState(false);
  const [hayLinterna, setHayLinterna] = useState(false);

  // ── Cargar jsQR ────────────────────────────────────────────────────────
  useEffect(() => {
    import("jsqr").then((m) => {
      jsqrRef.current = m.default;
    });
  }, []);

  // ── Linterna ───────────────────────────────────────────────────────────
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

  // ── Loop en vivo ───────────────────────────────────────────────────────
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

  // ── Decodificar foto (modo nativo / subir imagen) ──────────────────────
  const decodeImage = useCallback(
    (file) => {
      if (!file) return;
      setFase("decoding");

      const wait = (tries = 0) => {
        if (!jsqrRef.current) {
          if (tries > 30) {
            setFase("native");
            return;
          }
          setTimeout(() => wait(tries + 1), 150);
        } else {
          run();
        }
      };

      // Leer orientación EXIF para corregir fotos rotadas de cámara
      const readExif = (buf) => {
        try {
          const v = new DataView(buf);
          if (v.getUint16(0, false) !== 0xffd8) return 0;
          let off = 2;
          while (off < v.byteLength - 2) {
            const m = v.getUint16(off, false);
            off += 2;
            if (m === 0xffe1) {
              if (v.getUint32(off + 2, false) !== 0x45786966) return 0;
              const le = v.getUint16(off + 8, false) === 0x4949;
              const dir = v.getUint32(off + 14, le);
              const n = v.getUint16(off + 8 + dir, le);
              for (let i = 0; i < n; i++) {
                const b = off + 8 + dir + 2 + i * 12;
                if (v.getUint16(b, le) === 0x0112)
                  return v.getUint16(b + 8, le);
              }
              return 0;
            }
            if ((m & 0xff00) !== 0xff00) break;
            off += v.getUint16(off, false);
          }
        } catch (_) {}
        return 0;
      };

      const draw = (img, w, h, deg) => {
        const cv = document.createElement("canvas");
        if (deg === 90 || deg === 270) {
          cv.width = h;
          cv.height = w;
        } else {
          cv.width = w;
          cv.height = h;
        }
        const ctx = cv.getContext("2d");
        ctx.save();
        if (deg === 90) {
          ctx.translate(h, 0);
          ctx.rotate(Math.PI / 2);
        }
        if (deg === 180) {
          ctx.translate(w, h);
          ctx.rotate(Math.PI);
        }
        if (deg === 270) {
          ctx.translate(0, w);
          ctx.rotate(-Math.PI / 2);
        }
        ctx.drawImage(img, 0, 0, w, h);
        ctx.restore();
        return ctx.getImageData(0, 0, cv.width, cv.height);
      };

      const tryDecode = (img, exifDeg) => {
        const jsqr = jsqrRef.current;
        const MAX = 2000;
        const r = Math.min(1, MAX / Math.max(img.width, img.height));
        const w = Math.round(img.width * r),
          h = Math.round(img.height * r);
        for (const deg of [...new Set([exifDeg, 0, 90, 270, 180])]) {
          const d = draw(img, w, h, deg);
          const code =
            jsqr(d.data, d.width, d.height, {
              inversionAttempts: "dontInvert",
            }) ||
            jsqr(d.data, d.width, d.height, {
              inversionAttempts: "onlyInvert",
            }) ||
            jsqr(d.data, d.width, d.height, {
              inversionAttempts: "attemptBoth",
            });
          if (code) return code;
        }
        return null;
      };

      const showResult = (code) => {
        if (!code) {
          setFase("native");
          Swal.fire({
            background: "#fff",
            icon: "warning",
            title: "QR no válido",
            text: "No se detectó ningún código QR. Enfoca bien el código e intenta de nuevo.",
            confirmButtonColor: "#235347",
            confirmButtonText: "Intentar de nuevo",
          });
          return;
        }
        const tok = code.data.trim();
        if (tok === tokenEsperado) {
          setFase("success");
          setTimeout(() => onExito(tok), 500);
        } else {
          setFase("native");
          Swal.fire({
            background: "#fff",
            icon: "error",
            title: "QR no válido",
            text: "El código QR no corresponde a tu turno. Escanea el QR correcto del supervisor.",
            confirmButtonColor: "#235347",
            confirmButtonText: "Intentar de nuevo",
          });
        }
      };

      const run = () => {
        const fr = new FileReader();
        fr.onload = (ev) => {
          const buf = ev.target.result;
          const exif = readExif(buf);
          const exifDeg =
            exif === 6 ? 90 : exif === 8 ? 270 : exif === 3 ? 180 : 0;
          const url = URL.createObjectURL(
            new Blob([buf], { type: file.type || "image/jpeg" }),
          );
          const img = new Image();
          img.onload = () => {
            URL.revokeObjectURL(url);
            showResult(tryDecode(img, exifDeg));
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            setFase("native");
            Swal.fire({
              background: "#fff",
              icon: "error",
              title: "QR no válido",
              text: "No se pudo leer la imagen. Intenta de nuevo.",
              confirmButtonColor: "#235347",
              confirmButtonText: "Intentar de nuevo",
            });
          };
          img.src = url;
        };
        fr.onerror = () => {
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
        fr.readAsArrayBuffer(file);
      };

      wait();
    },
    [tokenEsperado, onExito],
  );

  // ── Iniciar cámara ─────────────────────────────────────────────────────
  // Siempre intenta getUserMedia. En PC funciona aunque sea HTTP.
  // Solo cae al modo nativo si el navegador rechaza por contexto inseguro
  // (típicamente celulares con HTTP que bloquean mediaDevices completamente).
  const requestCamera = useCallback(async () => {
    setFase("requesting");

    // Si mediaDevices no existe en absoluto → modo nativo (celular HTTP)
    if (!navigator.mediaDevices?.getUserMedia) {
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
        // Usuario negó el permiso → mostrar pantalla de permiso
        setFase("denied");
      } else if (
        n === "NotSupportedError" ||
        n === "SecurityError" ||
        err.message?.includes("secure") ||
        err.message?.includes("insecure")
      ) {
        // Contexto inseguro (celular con HTTP) → modo nativo
        setFase("native");
      } else if (n === "NotFoundError") {
        // No hay cámara → modo nativo para subir imagen
        setFase("native");
      } else {
        // Cualquier otro error → modo nativo como fallback
        setFase("native");
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
      {/* Input file — sin capture para que iOS muestre "Escanear QR" en el menú */}
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
          e.target.value = "";
          if (file) decodeImage(file);
        }}
      />

      {/* Video fullscreen */}
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

      {/* Overlay con recorte */}
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

      {/* Marco visor */}
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

      {/* Instrucción visor activo */}
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

      {/* Estados sin visor en vivo */}
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
          {/* Iniciando / leyendo */}
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
                {fase === "decoding" ? "Leyendo QR..." : "Iniciando cámara..."}
              </p>
            </div>
          )}

          {/* Permiso denegado */}
          {fase === "denied" && (
            <div
              style={{
                width: "100%",
                maxWidth: "340px",
                background: "rgba(15,15,15,.97)",
                borderRadius: "28px",
                padding: "32px 24px",
                border: "1px solid rgba(251,191,36,.2)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "20px",
                  background: "rgba(251,191,36,.12)",
                  border: "1px solid rgba(251,191,36,.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 18px",
                }}
              >
                <svg
                  width="28"
                  height="28"
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
                Permiso de cámara requerido
              </p>
              <p
                style={{
                  color: "rgba(255,255,255,.55)",
                  fontSize: "13px",
                  lineHeight: "1.6",
                  margin: "0 0 20px",
                }}
              >
                Haz clic en el candado 🔒 de la barra del navegador y permite el
                acceso a la cámara, luego toca "Intentar de nuevo".
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
                onClick={() => setFase("native")}
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
                Subir foto del QR en su lugar
              </button>
            </div>
          )}

          {/* Modo nativo — celular HTTP o no hay cámara */}
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
                  margin: "0 0 4px",
                }}
              >
                Toca el botón para abrir la cámara.
              </p>
              <p
                style={{
                  color: "rgba(255,255,255,.3)",
                  fontSize: "12px",
                  lineHeight: "1.5",
                  margin: "0 0 24px",
                }}
              >
                <strong style={{ color: "rgba(255,255,255,.45)" }}>iOS:</strong>{" "}
                elige "Escanear código QR" en el menú.{"  "}
                <strong style={{ color: "rgba(255,255,255,.45)" }}>
                  Android:
                </strong>{" "}
                apunta al QR y toma la foto.
              </p>

              <button
                onClick={() => fileRef.current?.click()}
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
                  Dile al supervisor que registre tu turno manualmente.
                </p>
              </div>
            </div>
          )}

          {/* Éxito modo nativo */}
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
