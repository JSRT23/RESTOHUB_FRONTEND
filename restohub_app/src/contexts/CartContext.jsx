import { createContext, useContext, useState, useCallback } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [restauranteId, setRid] = useState(null);

  const add = useCallback(
    (plato, precio, rid) => {
      if (restauranteId && restauranteId !== rid) return false;
      if (!restauranteId) setRid(rid);
      setItems((prev) => {
        const ex = prev.find((i) => i.platoId === plato.id);
        if (ex)
          return prev.map((i) =>
            i.platoId === plato.id ? { ...i, cantidad: i.cantidad + 1 } : i,
          );
        return [
          ...prev,
          {
            platoId: plato.id,
            nombre: plato.nombre,
            precio,
            cantidad: 1,
            imagen: plato.imagen,
          },
        ];
      });
      return true;
    },
    [restauranteId],
  );

  const remove = useCallback((platoId) => {
    setItems((prev) => {
      const next = prev
        .map((i) =>
          i.platoId === platoId ? { ...i, cantidad: i.cantidad - 1 } : i,
        )
        .filter((i) => i.cantidad > 0);
      if (next.length === 0) setRid(null);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setRid(null);
  }, []);

  const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const count = items.reduce((s, i) => s + i.cantidad, 0);

  return (
    <CartContext.Provider
      value={{ items, restauranteId, add, remove, clear, total, count }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
