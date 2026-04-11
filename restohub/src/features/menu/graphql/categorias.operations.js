// src/features/menu/graphql/categorias.operations.js
import { gql } from "@apollo/client";

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

export const CREAR_CATEGORIA = gql`
  mutation CrearCategoria($nombre: String!, $orden: Int) {
    crearCategoria(nombre: $nombre, orden: $orden) {
      ok
      error
      categoria {
        id
        nombre
        orden
        activo
      }
    }
  }
`;

export const ACTUALIZAR_CATEGORIA = gql`
  mutation ActualizarCategoria($id: ID!, $nombre: String, $orden: Int) {
    actualizarCategoria(id: $id, nombre: $nombre, orden: $orden) {
      ok
      error
      categoria {
        id
        nombre
        orden
        activo
      }
    }
  }
`;

export const DESACTIVAR_CATEGORIA = gql`
  mutation DesactivarCategoria($id: ID!) {
    desactivarCategoria(id: $id) {
      ok
      error
    }
  }
`;
