// src/features/menu/components/admin/graphql/operations.js
// Queries y mutations para ADMIN_CENTRAL
// - Restaurantes: CRUD completo
// - Gerente: registro auth + empleado staff
// - Menu: vista de solo lectura del menú de un restaurante
import { gql } from "@apollo/client";

// ── Queries — Restaurantes ─────────────────────────────────────────────────

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
      fechaCreacion
    }
  }
`;

// Menú del restaurante — usa la estructura REAL del gateway (MenuRestauranteType)
// restauranteId, nombre, ciudad, pais, moneda son campos planos
// categorias[categoriaId, nombre, orden, platos[platoId, nombre, descripcion, imagen, precio, moneda]]
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

// Gerente activo del restaurante — usa gerenteRestaurante del StaffQuery
// Devuelve el primer EmpleadoType con rol gerente activo en ese restaurante
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

// ── Mutations — Restaurante (admin_central) ────────────────────────────────

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

// ── Mutations — Auth: crear usuario gerente ────────────────────────────────
// rol hardcodeado como "gerente_local" — el admin no puede elegir otro rol aquí

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

// ── Mutations — Staff: crear empleado gerente ──────────────────────────────
// El campo "restaurante" recibe el UUID del menu_service
// El staff_service lo mapea internamente al RestauranteLocal correspondiente

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

// ── Mutations — Staff: activar/desactivar empleado (solo admin_central) ───

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
