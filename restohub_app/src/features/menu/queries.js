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

// También mantenemos el menuRestaurante como fallback
export const GET_MENU_RESTAURANTE = gql`
  query GetMenuRestaurante($restauranteId: ID!) {
    menuRestaurante(restauranteId: $restauranteId) {
      restauranteId
      nombre
      ciudad
      pais
      moneda
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
