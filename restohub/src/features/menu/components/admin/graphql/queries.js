// src/features/menu/components/admin/graphql/queries.js
// Queries del ADMIN_CENTRAL para ingredientes, platos y precios.
// El admin ve todos los ingredientes y platos (globales + de cualquier restaurante).
// restauranteId se incluye en el return para saber si son globales (null) o scoped.
// Las queries de restaurante están en operations.js
// Las queries de categorías están en categorias.operations.js
import { gql } from "@apollo/client";

// Todos los ingredientes — admin ve globales y de todos los restaurantes.
// restauranteId=null → global, restauranteId=UUID → del restaurante.
export const GET_INGREDIENTES = gql`
  query GetIngredientes($activo: Boolean, $restauranteId: ID) {
    ingredientes(activo: $activo, restauranteId: $restauranteId) {
      id
      restauranteId
      nombre
      unidadMedida
      descripcion
      activo
    }
  }
`;

// Todos los platos — admin ve globales y de todos los restaurantes.
// restauranteId=null → global, restauranteId=UUID → del restaurante.
export const GET_PLATOS = gql`
  query GetPlatos($activo: Boolean, $categoriaId: ID, $restauranteId: ID) {
    platos(
      activo: $activo
      categoriaId: $categoriaId
      restauranteId: $restauranteId
    ) {
      id
      restauranteId
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
      restauranteId
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

// Vista pública del menú de un restaurante — solo lectura para el admin.
// Usa la estructura REAL del gateway (MenuRestauranteType): campos planos.
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
