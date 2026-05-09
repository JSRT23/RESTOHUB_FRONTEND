import { gql } from "@apollo/client";

export const GET_RESTAURANTE = gql`
  query GetRestaurante($id: ID!) {
    restaurante(id: $id) {
      id
      nombre
      pais
      ciudad
      direccion
      moneda
      activo
      imagen
    }
  }
`;

// Platos del restaurante con su categoría real
export const GET_PLATOS_RESTAURANTE = gql`
  query GetPlatosRestaurante($restauranteId: ID!) {
    platos(activo: true, restauranteId: $restauranteId) {
      id
      nombre
      descripcion
      imagen
      categoriaId
      categoriaNombre
      restauranteId
    }
    precios(restauranteId: $restauranteId, activo: true) {
      id
      platoId
      precio
      moneda
      activo
      estaVigente
    }
  }
`;

// menuRestaurante como fallback — ahora incluye imagen del restaurante
export const GET_MENU_RESTAURANTE = gql`
  query GetMenuRestaurante($restauranteId: ID!) {
    menuRestaurante(restauranteId: $restauranteId) {
      restauranteId
      nombre
      ciudad
      pais
      moneda
      imagen
      categorias {
        categoriaId
        nombre
        orden
        platos {
          platoId
          nombre
          descripcion
          imagen
          precio
          moneda
        }
      }
    }
  }
`;
