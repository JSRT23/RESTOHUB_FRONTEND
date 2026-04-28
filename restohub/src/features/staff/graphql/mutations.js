// src/features/staff/graphql/mutations.js
import { gql } from "@apollo/client";

// ── AUTH: registrar usuario en auth_service ───────────────────────────────
export const REGISTRAR_USUARIO_EMPLEADO = gql`
  mutation RegistrarUsuarioEmpleado(
    $email: String!
    $nombre: String!
    $password: String!
    $passwordConfirm: String!
    $rol: String!
    $restauranteId: ID!
  ) {
    registrarUsuario(
      email: $email
      nombre: $nombre
      password: $password
      passwordConfirm: $passwordConfirm
      rol: $rol
      restauranteId: $restauranteId
    ) {
      ok
      error
      usuario {
        id
        email
        nombre
        rol
        restauranteId
        empleadoId
      }
    }
  }
`;

// ── EMPLEADOS ─────────────────────────────────────────────────────────────

export const CREAR_EMPLEADO = gql`
  mutation CrearEmpleado(
    $nombre: String!
    $apellido: String!
    $documento: String!
    $email: String!
    $telefono: String
    $rol: String!
    $pais: String!
    $restaurante: ID!
    $fechaContratacion: String
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
      fechaContratacion: $fechaContratacion
    ) {
      ok
      empleado {
        id
        nombre
        apellido
        documento
        email
        telefono
        rol
        rolDisplay
        pais
        restaurante
        restauranteNombre
        fechaContratacion
        activo
      }
      errores
    }
  }
`;

export const EDITAR_EMPLEADO = gql`
  mutation EditarEmpleado(
    $empleadoId: ID!
    $nombre: String
    $apellido: String
    $telefono: String
    $rol: String
  ) {
    editarEmpleado(
      empleadoId: $empleadoId
      nombre: $nombre
      apellido: $apellido
      telefono: $telefono
      rol: $rol
    ) {
      ok
      empleado {
        id
        nombre
        apellido
        telefono
        rol
        rolDisplay
        activo
      }
      errores
    }
  }
`;

export const EDITAR_FECHA_CONTRATACION = gql`
  mutation EditarFechaContratacion(
    $empleadoId: ID!
    $fechaContratacion: String
  ) {
    editarEmpleado(
      empleadoId: $empleadoId
      fechaContratacion: $fechaContratacion
    ) {
      ok
      empleado {
        id
        fechaContratacion
        activo
      }
      errores
    }
  }
`;

export const DESACTIVAR_EMPLEADO = gql`
  mutation DesactivarEmpleado($empleadoId: ID!) {
    desactivarEmpleado(empleadoId: $empleadoId) {
      ok
      empleado {
        id
        activo
      }
      errores
    }
  }
`;

export const ACTIVAR_EMPLEADO = gql`
  mutation ActivarEmpleado($empleadoId: ID!) {
    activarEmpleado(empleadoId: $empleadoId) {
      ok
      empleado {
        id
        activo
      }
      errores
    }
  }
`;

// ── TURNOS ────────────────────────────────────────────────────────────────

export const CREAR_TURNO = gql`
  mutation CrearTurno(
    $empleado: ID!
    $restauranteId: ID!
    $fechaInicio: String!
    $fechaFin: String!
    $notas: String
  ) {
    crearTurno(
      empleado: $empleado
      restauranteId: $restauranteId
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
      notas: $notas
    ) {
      ok
      turno {
        id
        empleado
        empleadoNombre
        fechaInicio
        fechaFin
        estado
        estadoDisplay
        duracionHoras
        qrToken
        notas
      }
      errores
    }
  }
`;

export const INICIAR_TURNO = gql`
  mutation IniciarTurno($turnoId: ID!) {
    iniciarTurno(turnoId: $turnoId) {
      ok
      turno {
        id
        estado
        estadoDisplay
        qrToken
        qrExpiraEn
      }
      errores
    }
  }
`;

export const CANCELAR_TURNO = gql`
  mutation CancelarTurno($turnoId: ID!) {
    cancelarTurno(turnoId: $turnoId) {
      ok
      turno {
        id
        estado
        estadoDisplay
      }
      errores
    }
  }
`;

export const COMPLETAR_TURNO = gql`
  mutation CompletarTurno($turnoId: ID!) {
    completarTurno(turnoId: $turnoId) {
      ok
      turno {
        id
        estado
        estadoDisplay
      }
      errores
    }
  }
`;

export const REGISTRAR_SALIDA = gql`
  mutation RegistrarSalida($turnoId: ID!) {
    registrarSalida(turnoId: $turnoId) {
      ok
      turno {
        id
        estado
        estadoDisplay
      }
      errores
    }
  }
`;

// ── NÓMINA ────────────────────────────────────────────────────────────────

export const GENERAR_NOMINA = gql`
  mutation GenerarNomina(
    $periodoInicio: String!
    $periodoFin: String!
    $empleadoId: ID
    $restauranteId: ID
  ) {
    generarNomina(
      periodoInicio: $periodoInicio
      periodoFin: $periodoFin
      empleadoId: $empleadoId
      restauranteId: $restauranteId
    ) {
      ok
      resumenes {
        id
        empleado
        empleadoNombre
        periodoInicio
        periodoFin
        totalHorasNormales
        totalHorasExtra
        totalHoras
        diasTrabajados
        moneda
        monedaDisplay
        cerrado
      }
      errores
    }
  }
`;

export const CERRAR_NOMINA = gql`
  mutation CerrarNomina($resumenId: ID!) {
    cerrarNomina(resumenId: $resumenId) {
      ok
      resumen {
        id
        empleadoNombre
        cerrado
      }
      errores
    }
  }
`;

// ── AUTH: desactivar / activar usuario ────────────────────────────────────

export const DESACTIVAR_USUARIO_AUTH = gql`
  mutation DesactivarUsuarioAuth($email: String!) {
    desactivarUsuario(email: $email) {
      ok
      error
    }
  }
`;

export const ACTIVAR_USUARIO_AUTH = gql`
  mutation ActivarUsuarioAuth($email: String!) {
    activarUsuario(email: $email) {
      ok
      error
    }
  }
`;

// ── VINCULAR EMPLEADO A CUENTA AUTH ───────────────────────────────────────
// Asigna el empleadoId al usuario auth para completar la vinculación.
// Misma mutation que usa AdminUsuariosList.
export const VINCULAR_EMPLEADO_ID = gql`
  mutation VincularEmpleadoId($email: String!, $empleadoId: ID!) {
    vincularEmpleadoId(email: $email, empleadoId: $empleadoId) {
      ok
      error
    }
  }
`;
