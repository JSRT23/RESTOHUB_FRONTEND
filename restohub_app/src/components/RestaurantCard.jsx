import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function RestaurantCard({ restaurante, index = 0 }) {
  const {
    id,
    nombre,
    descripcion,
    ciudad,
    activo,
    tieneMenu,
    calificacion,
    reseñas,
    imagen,
  } = restaurante;
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (!tieneMenu) {
      e.preventDefault();
      return;
    }
    navigate(`/restaurante/${id}`);
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "block",
        background: "#fff",
        borderRadius: "20px",
        overflow: "hidden",
        border: `1px solid ${hovered && tieneMenu ? "rgba(10,56,40,0.25)" : "var(--border)"}`,
        transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        animation: `fadeUp 0.5s ease ${index * 0.06}s both`,
        cursor: tieneMenu ? "pointer" : "default",
        transform: hovered && tieneMenu ? "translateY(-6px)" : "translateY(0)",
        boxShadow:
          hovered && tieneMenu ? "0 20px 56px rgba(10,56,40,0.14)" : "none",
        opacity: !activo && !tieneMenu ? 0.82 : 1,
      }}
    >
      {/* ── Imagen ── */}
      <div
        style={{ position: "relative", height: "230px", overflow: "hidden" }}
      >
        <img
          src={imagen}
          alt={nombre}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.7s ease",
            transform: hovered && tieneMenu ? "scale(1.08)" : "scale(1)",
            filter: !tieneMenu ? "brightness(0.85)" : "brightness(1)",
          }}
        />

        {/* Gradiente base */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(7,45,32,0.65) 0%, rgba(7,45,32,0.08) 45%, transparent 100%)",
          }}
        />

        {/* ── OVERLAY "Próximamente" — aparece en hover si no tiene menú ── */}
        {!tieneMenu && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(7,45,32,0.72)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              opacity: hovered ? 1 : 0,
              transition: "opacity 0.3s ease",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "rgba(255,250,202,0.15)",
                border: "1.5px solid rgba(255,250,202,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="var(--cream)"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "18px",
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "-0.01em",
              }}
            >
              Próximamente
            </span>
            <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>
              Menú en preparación
            </span>
          </div>
        )}

        {/* ── Badge marca de agua "Próximamente" — siempre visible si no tiene menú ── */}
        {!tieneMenu && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%) rotate(-15deg)",
              border: "2px solid rgba(255,250,202,0.45)",
              borderRadius: "8px",
              padding: "6px 16px",
              pointerEvents: "none",
              opacity: hovered ? 0 : 0.7,
              transition: "opacity 0.3s ease",
            }}
          >
            <span
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--cream)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              Próximamente
            </span>
          </div>
        )}

        {/* Badge estado (Abierto/Cerrado) */}
        <span
          style={{
            position: "absolute",
            top: "14px",
            right: "14px",
            padding: "5px 11px",
            background: activo ? "rgba(10,56,40,0.88)" : "rgba(120,40,40,0.85)",
            border: `1px solid ${activo ? "rgba(255,250,202,0.3)" : "rgba(255,180,180,0.3)"}`,
            borderRadius: "20px",
            fontSize: "10px",
            fontWeight: 700,
            color: activo ? "var(--cream)" : "#fecaca",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            backdropFilter: "blur(8px)",
          }}
        >
          ● {activo ? "Abierto" : "Cerrado"}
        </span>

        {/* Ciudad */}
        <span
          style={{
            position: "absolute",
            bottom: "12px",
            left: "14px",
            fontSize: "12px",
            color: "rgba(255,255,255,0.9)",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <svg
            width="11"
            height="11"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2" />
          </svg>
          {ciudad}
        </span>

        {/* Flecha — solo si tiene menú */}
        {tieneMenu && (
          <span
            style={{
              position: "absolute",
              bottom: "10px",
              right: "14px",
              width: 32,
              height: 32,
              background: "var(--cream)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.2s",
              transform: hovered ? "scale(1.1)" : "scale(1)",
            }}
          >
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="var(--green)"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ padding: "16px 18px 18px" }}>
        <h3
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "17px",
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: "4px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {nombre}
        </h3>
        <p
          style={{
            fontSize: "12px",
            color: "var(--text2)",
            marginBottom: "10px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {descripcion}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Estrellas */}
          <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <svg
                key={s}
                width="12"
                height="12"
                fill={
                  s <= Math.round(calificacion) ? "var(--green)" : "#D8D8CC"
                }
                viewBox="0 0 24 24"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
            <span
              style={{
                fontSize: "11px",
                color: "var(--text3)",
                marginLeft: "4px",
              }}
            >
              {calificacion.toFixed(1)}
              {reseñas > 0 && (
                <span style={{ color: "var(--text3)" }}> ({reseñas})</span>
              )}
            </span>
          </div>
          {/* Chip */}
          {tieneMenu ? (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--green)",
                padding: "4px 12px",
                background: "var(--green-dim2)",
                border: "1px solid rgba(10,56,40,0.18)",
                borderRadius: "20px",
              }}
            >
              Ver menú →
            </span>
          ) : (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text3)",
                padding: "4px 12px",
                background: "var(--bg2)",
                border: "1px dashed var(--border2)",
                borderRadius: "20px",
              }}
            >
              En preparación
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function RestaurantCardSkeleton() {
  return (
    <div
      style={{
        borderRadius: "20px",
        overflow: "hidden",
        background: "#fff",
        border: "1px solid var(--border)",
      }}
    >
      <div className="skeleton" style={{ height: "230px" }} />
      <div style={{ padding: "16px 18px" }}>
        <div
          className="skeleton"
          style={{ height: "20px", width: "70%", marginBottom: "6px" }}
        />
        <div
          className="skeleton"
          style={{ height: "13px", width: "90%", marginBottom: "10px" }}
        />
        <div className="skeleton" style={{ height: "13px", width: "40%" }} />
      </div>
    </div>
  );
}
