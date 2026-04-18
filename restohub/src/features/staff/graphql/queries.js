// src/features/staff/graphql/queries.js
import { gql } from "@apollo/client";

// ── EMPLEADOS ─────────────────────────────────────────────────────────────

export const GET_EMPLEADOS = gql`
  query GetEmpleados($restauranteId: ID, $rol: String, $activo: Boolean) {
    empleados(restauranteId: $restauranteId, rol: $rol, activo: $activo) {
      id
      nombre
      apellido
      documento
      email
      telefono
      rol
      rolDisplay
      pais
      paisDisplay
      restaurante
      restauranteNombre
      fechaContratacion
      activo
    }
  }
`;

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
      pais
      paisDisplay
      restaurante
      restauranteNombre
      fechaContratacion
      activo
    }
  }
`;

export const GET_GERENTE_RESTAURANTE = gql`
  query GetGerenteRestaurante($restauranteId: ID!) {
    gerenteRestaurante(restauranteId: $restauranteId) {
      id
      nombre
      apellido
      rol
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

export const GET_TURNO = gql`
  query GetTurno($turnoId: ID!) {
    turno(turnoId: $turnoId) {
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

// ── ASISTENCIA ────────────────────────────────────────────────────────────

export const GET_ASISTENCIA = gql`
  query GetAsistencia(
    $empleadoId: ID
    $restauranteId: ID
    $fechaDesde: String
    $fechaHasta: String
  ) {
    asistencia(
      empleadoId: $empleadoId
      restauranteId: $restauranteId
      fechaDesde: $fechaDesde
      fechaHasta: $fechaHasta
    ) {
      id
      turno
      empleadoId
      empleadoNombre
      horaEntrada
      horaSalida
      metodoRegistro
      metodoDisplay
      horasNormales
      horasExtra
      horasTotales
    }
  }
`;

// ── NÓMINA ────────────────────────────────────────────────────────────────

export const GET_NOMINA = gql`
  query GetNomina($empleadoId: ID, $restauranteId: ID, $cerrado: Boolean) {
    nomina(
      empleadoId: $empleadoId
      restauranteId: $restauranteId
      cerrado: $cerrado
    ) {
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
  }
`;

// ── ALERTAS OPERACIONALES ─────────────────────────────────────────────────

export const GET_ALERTAS_OPERACIONALES = gql`
  query GetAlertasOperacionales(
    $restauranteId: ID
    $nivel: String
    $tipo: String
    $resuelta: Boolean
  ) {
    alertasOperacionales(
      restauranteId: $restauranteId
      nivel: $nivel
      tipo: $tipo
      resuelta: $resuelta
    ) {
      id
      restauranteId
      tipo
      tipoDisplay
      nivel
      nivelDisplay
      mensaje
      referenciaId
      resuelta
      createdAt
    }
  }
`;

// ── CONFIG LABORAL ────────────────────────────────────────────────────────

export const GET_CONFIG_LABORAL = gql`
  query GetConfigLaboral($restauranteId: ID!) {
    configLaboral(restauranteId: $restauranteId) {
      id
      pais
      paisDisplay
      horasMaxDiarias
      horasMaxSemanales
      factorHoraExtra
      descansoMinEntreturnos
      horasContinuasParaDescanso
      duracionDescansoObligatorio
    }
  }
`;
