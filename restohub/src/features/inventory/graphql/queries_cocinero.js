// src/features/inventory/graphql/queries_cocinero.js
// Queries que el cocinero necesita en su vista de Stock+Recetas.
// Re-exporta lo existente y agrega GET_PLATOS_DISPONIBLES para la tab de Recetas.

export { GET_STOCK, GET_ALMACENES, GET_ALERTAS, GET_RECETAS } from "./queries";

// Platos del menú con sus ingredientes — para la tab "Recetas" del cocinero
// El cocinero ve todos los platos activos de su restaurante y puede expandir
// cada uno para ver su lista de ingredientes.
import { gql } from "@apollo/client";

export const GET_PLATOS_CON_RECETA = gql`
  query GetPlatosConReceta($disponibles: ID, $activo: Boolean) {
    platos(disponibles: $disponibles, activo: $activo) {
      id
      nombre
      descripcion
      imagen
      categoriaNombre
      activo
    }
  }
`;
