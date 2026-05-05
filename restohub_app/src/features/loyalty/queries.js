import { gql } from "@apollo/client";

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

export const GET_CUPONES_CLIENTE = gql`
  query GetCuponesCliente($clienteId: ID!, $activo: Boolean) {
    cupones(clienteId: $clienteId, activo: $activo) {
      id
      codigo
      tipoDescuento
      tipoDescuentoDisplay
      valorDescuento
      clienteId
      promocionNombre
      usosActuales
      limiteUso
      fechaInicio
      fechaFin
      activo
      disponible
    }
  }
`;

export const GET_TRANSACCIONES_CLIENTE = gql`
  query GetTransaccionesCliente($clienteId: ID!) {
    transaccionesPuntos(clienteId: $clienteId) {
      id
      tipo
      tipoDisplay
      puntos
      puntosDisplay
      saldoAnterior
      saldoPosterior
      descripcion
      createdAt
    }
  }
`;

export const GET_PROMOCIONES_ACTIVAS = gql`
  query GetPromocionesActivas($activa: Boolean) {
    promociones(activa: $activa) {
      id
      nombre
      descripcion
      alcance
      alcanceDisplay
      tipoBeneficio
      tipoBeneficioDisplay
      valor
      puntosBonus
      fechaInicio
      fechaFin
      activa
    }
  }
`;

export const MUTATION_VALIDAR_CUPON = gql`
  query ValidarCupon($codigo: String!) {
    validarCupon(codigo: $codigo) {
      id
      codigo
      tipoDescuentoDisplay
      valorDescuento
      disponible
    }
  }
`;
