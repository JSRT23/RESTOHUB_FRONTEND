// src/features/restaurantes/graphql/operations.js
import { gql } from "@apollo/client";

// ── Queries ────────────────────────────────────────────────────────────────
export const GET_RESTAURANTES = gql`
  query GetRestaurantes($activo: Boolean) {
    restaurantes(activo: $activo) {
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

export const GET_MENU_RESTAURANTE = gql`
  query GetMenuRestaurante($restauranteId: ID!) {
    menuRestaurante(restauranteId: $restauranteId) {
      restaurante {
        id
        nombre
        moneda
      }
      categorias {
        categoria {
          id
          nombre
          descripcion
        }
        platos {
          plato {
            id
            nombre
            descripcion
            activo
          }
          precio {
            precio
            vigente_desde
          }
        }
      }
    }
  }
`;

// ── Mutations ──────────────────────────────────────────────────────────────
export const CREAR_RESTAURANTE = gql`
  mutation CrearRestaurante(
    $nombre: String!
    $pais: String!
    $ciudad: String!
    $direccion: String!
    $moneda: String!
  ) {
    crearRestaurante(
      nombre: $nombre
      pais: $pais
      ciudad: $ciudad
      direccion: $direccion
      moneda: $moneda
    ) {
      ok
      error
      restaurante {
        id
        nombre
        pais
        ciudad
        direccion
        moneda
        activo
      }
    }
  }
`;

export const ACTUALIZAR_RESTAURANTE = gql`
  mutation ActualizarRestaurante(
    $id: ID!
    $nombre: String
    $pais: String
    $ciudad: String
    $direccion: String
    $moneda: String
  ) {
    actualizarRestaurante(
      id: $id
      nombre: $nombre
      pais: $pais
      ciudad: $ciudad
      direccion: $direccion
      moneda: $moneda
    ) {
      ok
      error
      restaurante {
        id
        nombre
        ciudad
        pais
        moneda
        activo
      }
    }
  }
`;

export const ACTIVAR_RESTAURANTE = gql`
  mutation ActivarRestaurante($id: ID!) {
    activarRestaurante(id: $id) {
      ok
      error
    }
  }
`;

export const DESACTIVAR_RESTAURANTE = gql`
  mutation DesactivarRestaurante($id: ID!) {
    desactivarRestaurante(id: $id) {
      ok
      error
    }
  }
`;

export const REGISTRAR_GERENTE = gql`
  mutation RegistrarGerente(
    $email: String!
    $nombre: String!
    $password: String!
    $passwordConfirm: String!
    $restauranteId: ID!
  ) {
    registrarUsuario(
      email: $email
      nombre: $nombre
      password: $password
      passwordConfirm: $passwordConfirm
      rol: "gerente_local"
      restauranteId: $restauranteId
    ) {
      ok
      error
      usuario {
        id
        nombre
        email
        rol
        restauranteId
      }
    }
  }
`;

export const CREAR_EMPLEADO_GERENTE = gql`
  mutation CrearEmpleadoGerente(
    $nombre: String!
    $email: String!
    $rol: String!
    $restauranteId: ID!
    $userId: ID!
  ) {
    crearEmpleado(
      nombre: $nombre
      email: $email
      rol: $rol
      restauranteId: $restauranteId
      userId: $userId
    ) {
      ok
      error
      empleado {
        id
        nombre
        rol
      }
    }
  }
`;
