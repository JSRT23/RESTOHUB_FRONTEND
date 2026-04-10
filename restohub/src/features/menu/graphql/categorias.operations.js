// src/features/menu/graphql/categorias.operations.js
import { gql } from "@apollo/client";

export const GET_CATEGORIAS = gql`
  query GetCategorias($activo: Boolean) {
    categorias(activo: $activo) {
      id
      nombre
      descripcion
      orden
      activo
    }
  }
`;

export const CREAR_CATEGORIA = gql`
  mutation CrearCategoria($nombre: String!, $descripcion: String, $orden: Int) {
    crearCategoria(nombre: $nombre, descripcion: $descripcion, orden: $orden) {
      ok
      error
      categoria {
        id
        nombre
        descripcion
        orden
        activo
      }
    }
  }
`;

export const ACTUALIZAR_CATEGORIA = gql`
  mutation ActualizarCategoria(
    $id: ID!
    $nombre: String
    $descripcion: String
    $orden: Int
  ) {
    actualizarCategoria(
      id: $id
      nombre: $nombre
      descripcion: $descripcion
      orden: $orden
    ) {
      ok
      error
      categoria {
        id
        nombre
        descripcion
        orden
        activo
      }
    }
  }
`;

export const ACTIVAR_CATEGORIA = gql`
  mutation ActivarCategoria($id: ID!) {
    activarCategoria(id: $id) {
      ok
      error
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
