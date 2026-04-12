// src/features/menu/components/admin/graphql/categorias.operations.js
// Queries y mutations de CATEGORÍAS — solo admin_central.
// El gerente usa GET_CATEGORIAS_GERENTE en Gerente/graphql/operations.js (solo lectura).
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

// Faltaba en el archivo original — completa el ciclo activo/inactivo
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
