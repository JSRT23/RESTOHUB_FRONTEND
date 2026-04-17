// src/features/loyalty/graphql/operations.js
// Queries y mutations para loyalty_service via gateway GraphQL.
// Usadas por gerente_local y admin_central.

import { gql } from "@apollo/client";

// ── PUNTOS ────────────────────────────────────────────────────────────────

export const GET_PUNTOS_CLIENTE = gql`
  query GetPuntosCliente($clienteId: ID!) {
    puntosCliente(clienteId: $clienteId) {
      id
      clienteId
      saldo
      puntosTotalesHistoricos
      nivel
      nivelDisplay
      ultimaActualizacion
    }
  }
`;

export const GET_TRANSACCIONES = gql`
  query GetTransacciones($clienteId: ID, $pedidoId: ID, $tipo: String) {
    transaccionesPuntos(
      clienteId: $clienteId
      pedidoId: $pedidoId
      tipo: $tipo
    ) {
      id
      tipo
      tipoDisplay
      puntos
      saldoAnterior
      saldoPosterior
      pedidoId
      restauranteId
      descripcion
      createdAt
    }
  }
`;

export const ACUMULAR_PUNTOS = gql`
  mutation AcumularPuntos(
    $clienteId: ID!
    $puntos: Int!
    $pedidoId: ID
    $restauranteId: ID
    $descripcion: String
  ) {
    acumularPuntos(
      clienteId: $clienteId
      puntos: $puntos
      pedidoId: $pedidoId
      restauranteId: $restauranteId
      descripcion: $descripcion
    ) {
      ok
      error
      cuenta {
        id
        saldo
        nivel
        nivelDisplay
      }
    }
  }
`;

export const CANJEAR_PUNTOS = gql`
  mutation CanjearPuntos(
    $clienteId: ID!
    $puntos: Int!
    $pedidoId: ID
    $descripcion: String
  ) {
    canjearPuntos(
      clienteId: $clienteId
      puntos: $puntos
      pedidoId: $pedidoId
      descripcion: $descripcion
    ) {
      ok
      error
      cuenta {
        id
        saldo
        nivel
        nivelDisplay
      }
    }
  }
`;

// ── PROMOCIONES ───────────────────────────────────────────────────────────

export const GET_PROMOCIONES = gql`
  query GetPromociones(
    $activa: Boolean
    $alcance: String
    $restauranteId: ID
    $tipoBeneficio: String
  ) {
    promociones(
      activa: $activa
      alcance: $alcance
      restauranteId: $restauranteId
      tipoBeneficio: $tipoBeneficio
    ) {
      id
      nombre
      descripcion
      alcance
      alcanceDisplay
      marca
      restauranteId
      tipoBeneficio
      tipoBeneficioDisplay
      valor
      puntosBonus
      multiplicadorPuntos
      fechaInicio
      fechaFin
      activa
      totalAplicaciones
      reglas {
        id
        tipoCondicion
        tipoCondicionDisplay
        montoMinimo
        moneda
        platoId
        categoriaId
        horaInicio
        horaFin
      }
    }
  }
`;

export const CREAR_PROMOCION = gql`
  mutation CrearPromocion(
    $nombre: String!
    $descripcion: String
    $alcance: String!
    $marca: String
    $restauranteId: ID
    $tipoBeneficio: String!
    $valor: Float
    $puntosBonus: Int
    $multiplicadorPuntos: Float
    $fechaInicio: String!
    $fechaFin: String!
    $reglas: [ReglaPromocionInput]
  ) {
    crearPromocion(
      nombre: $nombre
      descripcion: $descripcion
      alcance: $alcance
      marca: $marca
      restauranteId: $restauranteId
      tipoBeneficio: $tipoBeneficio
      valor: $valor
      puntosBonus: $puntosBonus
      multiplicadorPuntos: $multiplicadorPuntos
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
      reglas: $reglas
    ) {
      ok
      error
      promocion {
        id
        nombre
        alcance
        activa
      }
    }
  }
`;

export const ACTIVAR_PROMOCION = gql`
  mutation ActivarPromocion($id: ID!) {
    activarPromocion(id: $id) {
      ok
      error
      promocion {
        id
        activa
      }
    }
  }
`;

export const DESACTIVAR_PROMOCION = gql`
  mutation DesactivarPromocion($id: ID!) {
    desactivarPromocion(id: $id) {
      ok
      error
      promocion {
        id
        activa
      }
    }
  }
`;

// ── CUPONES ───────────────────────────────────────────────────────────────

export const GET_CUPONES = gql`
  query GetCupones($clienteId: ID, $activo: Boolean, $codigo: String) {
    cupones(clienteId: $clienteId, activo: $activo, codigo: $codigo) {
      id
      codigo
      promocion
      promocionNombre
      clienteId
      tipoDescuento
      tipoDescuentoDisplay
      valorDescuento
      limiteUso
      usosActuales
      fechaInicio
      fechaFin
      activo
      disponible
    }
  }
`;

export const CREAR_CUPON = gql`
  mutation CrearCupon(
    $promocionId: ID
    $clienteId: ID
    $tipoDescuento: String!
    $valorDescuento: Float!
    $limiteUso: Int
    $fechaInicio: String!
    $fechaFin: String!
    $codigo: String
  ) {
    crearCupon(
      promocionId: $promocionId
      clienteId: $clienteId
      tipoDescuento: $tipoDescuento
      valorDescuento: $valorDescuento
      limiteUso: $limiteUso
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
      codigo: $codigo
    ) {
      ok
      error
      cupon {
        id
        codigo
        disponible
      }
    }
  }
`;

export const VALIDAR_CUPON = gql`
  query ValidarCupon($codigo: String!) {
    validarCupon(codigo: $codigo) {
      id
      codigo
      tipoDescuento
      tipoDescuentoDisplay
      valorDescuento
      disponible
      usosActuales
      limiteUso
      fechaFin
    }
  }
`;

export const CANJEAR_CUPON = gql`
  mutation CanjearCupon($id: ID!, $pedidoId: ID) {
    canjearCupon(id: $id, pedidoId: $pedidoId) {
      ok
      error
      cupon {
        id
        codigo
        usosActuales
        disponible
      }
    }
  }
`;
