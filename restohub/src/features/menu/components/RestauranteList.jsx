// src/features/restaurantes/components/RestauranteList.jsx

import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";
import { GET_RESTAURANTES } from "../graphql/getRestaurantes";

export default function RestaurantesList() {
  const { data, loading, error } = useQuery(GET_RESTAURANTES);

  if (loading) return <p>Cargando restaurantes...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h1>🔥 RestoHub</h1>
      <h2>Restaurantes</h2>

      {data.restaurantes.map((r) => (
        <div key={r.id} style={{ marginBottom: "10px" }}>
          <strong>{r.nombre}</strong>
          <p>
            {r.ciudad}, {r.pais}
          </p>
          <p>{r.direccion}</p>
          <p>{r.moneda}</p>
        </div>
      ))}
    </div>
  );
}
