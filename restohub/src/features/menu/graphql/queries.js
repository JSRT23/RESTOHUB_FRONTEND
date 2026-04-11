// src/features/menu/graphql/queries.js
// Queries del GERENTE — ingredientes, platos, precios
// Las queries de restaurante están en operations.js
// Las queries de categorías (con descripcion) están en categorias.operations.js
import { gql } from "@apollo/client";

export const GET_INGREDIENTES = gql`
  query GetIngredientes($activo: Boolean) {
    ingredientes(activo: $activo) {
      id
      nombre
      unidadMedida
      descripcion
      activo
    }
  }
`;

export const GET_PLATOS = gql`
  query GetPlatos($activo: Boolean, $categoriaId: ID) {
    platos(activo: $activo, categoriaId: $categoriaId) {
      id
      nombre
      descripcion
      categoriaId
      categoriaNombre
      imagen
      activo
      fechaCreacion
    }
  }
`;

export const GET_PLATO = gql`
  query GetPlato($id: ID!) {
    plato(id: $id) {
      id
      nombre
      descripcion
      categoriaId
      categoriaNombre
      imagen
      activo
      fechaCreacion
      ingredientes {
        id
        ingredienteId
        ingredienteNombre
        unidadMedida
        cantidad
      }
      precios {
        id
        platoId
        restauranteId
        restauranteNombre
        precio
        moneda
        fechaInicio
        fechaFin
        activo
        estaVigente
      }
    }
  }
`;

export const GET_PRECIOS = gql`
  query GetPrecios($platoId: ID, $restauranteId: ID, $activo: Boolean) {
    precios(platoId: $platoId, restauranteId: $restauranteId, activo: $activo) {
      id
      platoId
      restauranteId
      restauranteNombre
      precio
      moneda
      fechaInicio
      fechaFin
      activo
      estaVigente
    }
  }
`;

// Menu público del restaurante (para vista pública y admin en solo lectura)
export const GET_MENU_RESTAURANTE_PUBLICO = gql`
  query GetMenuRestaurantePublico($restauranteId: ID!) {
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
