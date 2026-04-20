// portal_empleados/src/features/turno/graphql/operations.js
import { gql } from "@apollo/client";

// ── AUTH ──────────────────────────────────────────────────────────────────
export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      ok
      error
      codigo
      payload {
        accessToken
        refreshToken
        usuario {
          id
          email
          nombre
          rol
          restauranteId
          empleadoId
          activo
        }
      }
    }
  }
`;

// ── EMPLEADO ──────────────────────────────────────────────────────────────
export const GET_EMPLEADO = gql`
  query GetEmpleado($empleadoId: ID!) {
    empleado(empleadoId: $empleadoId) {
      id
      nombre
      apellido
      documento
      email
      telefono
      rol
      rolDisplay
      restauranteNombre
      fechaContratacion
      activo
    }
  }
`;

// Buscar empleado por documento (para el kiosco del supervisor)
export const GET_EMPLEADOS = gql`
  query GetEmpleados($restauranteId: ID) {
    empleados(restauranteId: $restauranteId, activo: true) {
      id
      nombre
      apellido
      documento
      rol
      rolDisplay
    }
  }
`;

// ── TURNOS ────────────────────────────────────────────────────────────────
export const GET_TURNOS = gql`
  query GetTurnos(
    $empleadoId: ID
    $restauranteId: ID
    $estado: String
    $fechaDesde: String
    $fechaHasta: String
  ) {
    turnos(
      empleadoId: $empleadoId
      restauranteId: $restauranteId
      estado: $estado
      fechaDesde: $fechaDesde
      fechaHasta: $fechaHasta
    ) {
      id
      empleado
      empleadoNombre
      restauranteId
      fechaInicio
      fechaFin
      estado
      estadoDisplay
      duracionHoras
      qrToken
      qrExpiraEn
      notas
    }
  }
`;

// ── MUTATIONS DE TURNO ────────────────────────────────────────────────────
export const INICIAR_TURNO = gql`
  mutation IniciarTurno($turnoId: ID!) {
    iniciarTurno(turnoId: $turnoId) {
      ok
      turno {
        id
        estado
        qrToken
        qrExpiraEn
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
      }
      errores
    }
  }
`;

// ── ASISTENCIA ────────────────────────────────────────────────────────────
export const GET_ASISTENCIA_HOY = gql`
  query GetAsistenciaHoy($restauranteId: ID, $fechaDesde: String) {
    asistencia(restauranteId: $restauranteId, fechaDesde: $fechaDesde) {
      id
      turno
      empleadoId
      empleadoNombre
      horaEntrada
      horaSalida
      horasTotales
    }
  }
`;
