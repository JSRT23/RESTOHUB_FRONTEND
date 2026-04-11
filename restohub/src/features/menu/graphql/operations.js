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

// Gerente activo del restaurante — usa StaffQuery.gerente_restaurante
export const GET_GERENTE_RESTAURANTE = gql`
  query GetGerenteRestaurante($restauranteId: ID!) {
    gerenteRestaurante(restauranteId: $restauranteId) {
      id
      nombre
      apellido
      email
      telefono
      documento
      rol
      rolDisplay
      activo
    }
  }
`;

// ── Mutations restaurante ──────────────────────────────────────────────────
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

// ── Mutations auth — crear usuario gerente ────────────────────────────────
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

// ── Mutations staff — crear empleado gerente ──────────────────────────────
// Usa CrearEmpleado del StaffMutation (ya existe en el gateway)
// Campos exactos del staff_service: nombre, apellido, documento,
// email, rol, pais (código 2 letras), restaurante (UUID)
export const CREAR_EMPLEADO_STAFF = gql`
  mutation CrearEmpleadoStaff(
    $nombre: String!
    $apellido: String!
    $documento: String!
    $email: String!
    $telefono: String
    $rol: String!
    $pais: String!
    $restaurante: ID!
  ) {
    crearEmpleado(
      nombre: $nombre
      apellido: $apellido
      documento: $documento
      email: $email
      telefono: $telefono
      rol: $rol
      pais: $pais
      restaurante: $restaurante
    ) {
      ok
      errores
      empleado {
        id
        nombre
        apellido
        email
        telefono
        rol
        activo
      }
    }
  }
`;

// ── Mutations empleado — activar/desactivar (admin_central) ───────────────
export const ACTIVAR_EMPLEADO = gql`
  mutation ActivarEmpleado($empleadoId: ID!) {
    activarEmpleado(empleadoId: $empleadoId) {
      ok
      errores
      empleado {
        id
        nombre
        activo
      }
    }
  }
`;

export const DESACTIVAR_EMPLEADO = gql`
  mutation DesactivarEmpleado($empleadoId: ID!) {
    desactivarEmpleado(empleadoId: $empleadoId) {
      ok
      errores
      empleado {
        id
        nombre
        activo
      }
    }
  }
`;
