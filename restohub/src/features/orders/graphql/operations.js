// src/features/orders/graphql/operations.js
// Queries y mutations de order_service vía gateway GraphQL.
// Usadas por supervisor, mesero, cocinero y cajero.

import { gql } from "@apollo/client";

// ── PEDIDOS ───────────────────────────────────────────────────────────────

export const GET_PEDIDOS = gql`
  query GetPedidos(
    $restauranteId: ID
    $estado: String
    $canal: String
    $clienteId: ID
  ) {
    pedidos(
      restauranteId: $restauranteId
      estado: $estado
      canal: $canal
      clienteId: $clienteId
    ) {
      id
      restauranteId
      clienteId
      canal
      estado
      prioridad
      total
      moneda
      mesaId
      fechaCreacion
      fechaEntregaEstimada
    }
  }
`;

export const GET_PEDIDO = gql`
  query GetPedido($id: ID!) {
    pedido(id: $id) {
      id
      restauranteId
      clienteId
      canal
      estado
      prioridad
      total
      moneda
      mesaId
      fechaCreacion
      fechaEntregaEstimada
      detalles {
        id
        platoId
        nombrePlato
        precioUnitario
        cantidad
        subtotal
        notas
      }
      comandas {
        id
        estacion
        estado
        horaEnvio
        horaFin
        tiempoPreparacionSegundos
      }
      seguimientos {
        id
        estado
        fecha
        descripcion
      }
      entrega {
        id
        tipoEntrega
        direccion
        repartidorId
        repartidorNombre
        estadoEntrega
        fechaSalida
        fechaEntregaReal
      }
    }
  }
`;

// ── ACCIONES DE ESTADO ────────────────────────────────────────────────────

export const CONFIRMAR_PEDIDO = gql`
  mutation ConfirmarPedido($id: ID!, $descripcion: String) {
    confirmarPedido(id: $id, descripcion: $descripcion) {
      id
      estado
      detalles {
        id
        platoId
        nombrePlato
        cantidad
      }
    }
  }
`;

export const CANCELAR_PEDIDO = gql`
  mutation CancelarPedido($id: ID!, $descripcion: String) {
    cancelarPedido(id: $id, descripcion: $descripcion) {
      id
      estado
    }
  }
`;

export const MARCAR_LISTO_PEDIDO = gql`
  mutation MarcarListoPedido($id: ID!, $descripcion: String) {
    marcarListoPedido(id: $id, descripcion: $descripcion) {
      id
      estado
    }
  }
`;

export const ENTREGAR_PEDIDO = gql`
  mutation EntregarPedido($id: ID!, $descripcion: String) {
    entregarPedido(id: $id, descripcion: $descripcion) {
      id
      estado
    }
  }
`;

// ── CREAR PEDIDO (mesero/cajero) ──────────────────────────────────────────

export const CREAR_PEDIDO = gql`
  mutation CrearPedido(
    $restauranteId: ID!
    $clienteId: ID
    $canal: String!
    $prioridad: Int
    $moneda: String!
    $mesaId: ID
    $fechaEntregaEstimada: String
    $detalles: [DetallePedidoInput!]!
  ) {
    crearPedido(
      restauranteId: $restauranteId
      clienteId: $clienteId
      canal: $canal
      prioridad: $prioridad
      moneda: $moneda
      mesaId: $mesaId
      fechaEntregaEstimada: $fechaEntregaEstimada
      detalles: $detalles
    ) {
      id
      estado
      total
      moneda
      fechaCreacion
    }
  }
`;

// ── COMANDAS DE COCINA ────────────────────────────────────────────────────

export const GET_COMANDAS = gql`
  query GetComandas($estado: String, $estacion: String, $pedidoId: ID) {
    comandas(estado: $estado, estacion: $estacion, pedidoId: $pedidoId) {
      id
      pedido
      estacion
      estado
      horaEnvio
      horaFin
      tiempoPreparacionSegundos
    }
  }
`;

export const INICIAR_COMANDA = gql`
  mutation IniciarComanda($id: ID!) {
    iniciarComanda(id: $id) {
      id
      estado
    }
  }
`;

export const COMANDA_LISTA = gql`
  mutation ComandaLista($id: ID!) {
    comandaLista(id: $id) {
      id
      estado
      horaFin
      tiempoPreparacionSegundos
    }
  }
`;

// ── ENTREGAS ──────────────────────────────────────────────────────────────

export const GET_ENTREGAS = gql`
  query GetEntregas($estadoEntrega: String, $tipoEntrega: String) {
    entregas(estadoEntrega: $estadoEntrega, tipoEntrega: $tipoEntrega) {
      id
      pedido
      tipoEntrega
      direccion
      repartidorId
      repartidorNombre
      estadoEntrega
      fechaSalida
      fechaEntregaReal
    }
  }
`;

export const ENTREGA_EN_CAMINO = gql`
  mutation EntregaEnCamino($id: ID!) {
    entregaEnCamino(id: $id) {
      id
      estadoEntrega
      fechaSalida
    }
  }
`;

export const COMPLETAR_ENTREGA = gql`
  mutation CompletarEntrega($id: ID!) {
    completarEntrega(id: $id) {
      id
      estadoEntrega
      fechaEntregaReal
    }
  }
`;
