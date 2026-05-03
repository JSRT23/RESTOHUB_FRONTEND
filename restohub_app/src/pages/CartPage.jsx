import { useNavigate } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";

const fmt = (n) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

export default function CartPage() {
  const navigate = useNavigate();
  const { items, add, remove, clear, total, count } = useCart();
  const { isAuthenticated } = useAuth();

  if (count === 0)
    return (
      <div
        style={{
          paddingTop: "68px",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
          textAlign: "center",
          padding: "80px 20px",
          gap: "14px",
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            background: "var(--green-dim2)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "36px",
          }}
        >
          🛒
        </div>
        <h2
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "30px",
            color: "var(--text)",
          }}
        >
          Tu carrito está vacío
        </h2>
        <p
          style={{ color: "var(--text2)", maxWidth: "340px", lineHeight: 1.65 }}
        >
          Explora los restaurantes y agrega los platos que quieras.
        </p>
        <button
          onClick={() => navigate("/")}
          className="btn-green"
          style={{ marginTop: "6px" }}
        >
          Explorar restaurantes
        </button>
      </div>
    );

  return (
    <div
      style={{
        paddingTop: "68px",
        minHeight: "100vh",
        background: "var(--bg)",
      }}
    >
      {/* Sub-header verde */}
      <div style={{ background: "var(--green)", padding: "28px 0" }}>
        <div
          className="container"
          style={{ display: "flex", alignItems: "center", gap: "12px" }}
        >
          <button
            onClick={() => navigate(-1)}
            style={{
              color: "rgba(255,255,255,0.5)",
              background: "none",
              fontSize: "16px",
              cursor: "pointer",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            ←
          </button>
          <h1
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "28px",
              color: "#fff",
            }}
          >
            Tu pedido
          </h1>
          <span
            style={{
              background: "var(--cream)",
              color: "var(--green)",
              fontSize: "11px",
              fontWeight: 800,
              padding: "3px 10px",
              borderRadius: "20px",
            }}
          >
            {count} ítems
          </span>
        </div>
      </div>

      <div
        className="container"
        style={{ paddingTop: "36px", paddingBottom: "80px", maxWidth: "860px" }}
      >
        <div style={{ display: "grid", gap: "24px" }}>
          {/* Items */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {items.map((item) => (
              <div
                key={item.platoId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  background: "#fff",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r)",
                  padding: "14px",
                  animation: "fadeUp 0.3s ease",
                }}
              >
                {item.imagen && (
                  <img
                    src={item.imagen}
                    alt={item.nombre}
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: "10px",
                      objectFit: "cover",
                      flexShrink: 0,
                    }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <h4
                    style={{
                      fontFamily: "Playfair Display, serif",
                      fontSize: "15px",
                      color: "var(--text)",
                      marginBottom: "3px",
                    }}
                  >
                    {item.nombre}
                  </h4>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--green)",
                      fontWeight: 600,
                    }}
                  >
                    {fmt(item.precio)}
                  </p>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <button
                    onClick={() => remove(item.platoId)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "8px",
                      background: "var(--bg2)",
                      border: "1px solid var(--border2)",
                      color: "var(--text)",
                      fontSize: "15px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    −
                  </button>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "14px",
                      minWidth: "18px",
                      textAlign: "center",
                      color: "var(--text)",
                    }}
                  >
                    {item.cantidad}
                  </span>
                  <button
                    onClick={() =>
                      add(
                        {
                          id: item.platoId,
                          nombre: item.nombre,
                          imagen: item.imagen,
                        },
                        item.precio,
                        null,
                      )
                    }
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "8px",
                      background: "var(--green-dim2)",
                      border: "1px solid rgba(10,56,40,0.2)",
                      color: "var(--green)",
                      fontSize: "15px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    +
                  </button>
                </div>
                <p
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontWeight: 700,
                    color: "var(--text)",
                    fontSize: "15px",
                    minWidth: "80px",
                    textAlign: "right",
                  }}
                >
                  {fmt(item.precio * item.cantidad)}
                </p>
              </div>
            ))}
          </div>

          {/* Resumen */}
          <div
            style={{
              background: "#fff",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-lg)",
              overflow: "hidden",
            }}
          >
            <div style={{ background: "var(--green)", padding: "18px 24px" }}>
              <h3
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: "18px",
                  color: "#fff",
                }}
              >
                Resumen del pedido
              </h3>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "9px",
                  fontSize: "13px",
                  color: "var(--text2)",
                }}
              >
                <span>Subtotal ({count} ítems)</span>
                <span>{fmt(total)}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "18px",
                  fontSize: "13px",
                  color: "var(--text2)",
                }}
              >
                <span>Envío</span>
                <span style={{ color: "var(--green)", fontWeight: 600 }}>
                  Gratis
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "16px 0",
                  borderTop: "1px solid var(--border)",
                  marginBottom: "18px",
                }}
              >
                <span
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: "17px",
                    fontWeight: 700,
                    color: "var(--text)",
                  }}
                >
                  Total
                </span>
                <span
                  style={{
                    fontFamily: "Playfair Display, serif",
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "var(--green)",
                  }}
                >
                  {fmt(total)}
                </span>
              </div>
              <button
                onClick={() =>
                  isAuthenticated
                    ? alert("¡Pedido enviado! (demo)")
                    : navigate("/login")
                }
                className="btn-cream"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: "14px",
                }}
              >
                {isAuthenticated ? "Confirmar pedido" : "Ingresar para pedir"}
              </button>
              <button
                onClick={clear}
                style={{
                  width: "100%",
                  marginTop: "8px",
                  padding: "11px",
                  background: "transparent",
                  border: "1px solid var(--border2)",
                  borderRadius: "var(--r-sm)",
                  color: "var(--text3)",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                Vaciar carrito
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
