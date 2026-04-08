// src/features/menu/graphql/queries.js
import { gql } from "@apollo/client";

export const GET_RESTAURANTES = gql`
  query GetRestaurantes($activo: Boolean, $pais: String) {
    restaurantes(activo: $activo, pais: $pais) {
      id
      nombre
      pais
      ciudad
      direccion
      moneda
      activo
      fechaCreacion
      fechaActualizacion
    }
  }
`;

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
      fechaCreacion
      fechaActualizacion
    }
  }
`;

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

export const GET_CATEGORIAS = gql`
  query GetCategorias($activo: Boolean) {
    categorias(activo: $activo) {
      id
      nombre
      orden
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
      fechaActualizacion
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
      fechaActualizacion
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
