// src/features/inventory/graphql/mutations.js
import { gql } from "@apollo/client";

// ── PROVEEDOR ─────────────────────────────────────────────────────────────
export const CREAR_PROVEEDOR = gql`
  mutation CrearProveedor(
    $nombre: String!
    $pais: String!
    $ciudad: String
    $telefono: String
    $email: String
    $monedaPreferida: String
  ) {
    crearProveedor(
      nombre: $nombre
      pais: $pais
      ciudad: $ciudad
      telefono: $telefono
      email: $email
      monedaPreferida: $monedaPreferida
    ) {
      ok
      error
      proveedor {
        id
        nombre
        pais
        monedaPreferida
        activo
      }
    }
  }
`;

// ── ALMACÉN ───────────────────────────────────────────────────────────────
export const CREAR_ALMACEN = gql`
  mutation CrearAlmacen(
    $restauranteId: ID!
    $nombre: String!
    $descripcion: String
  ) {
    crearAlmacen(
      restauranteId: $restauranteId
      nombre: $nombre
      descripcion: $descripcion
    ) {
      ok
      error
      almacen {
        id
        nombre
        restauranteId
        activo
      }
    }
  }
`;

// ── STOCK ─────────────────────────────────────────────────────────────────
export const REGISTRAR_STOCK = gql`
  mutation RegistrarStock(
    $ingredienteId: ID!
    $nombreIngrediente: String!
    $almacenId: ID!
    $unidadMedida: String!
    $cantidadActual: Float!
    $nivelMinimo: Float!
    $nivelMaximo: Float!
  ) {
    registrarStock(
      ingredienteId: $ingredienteId
      nombreIngrediente: $nombreIngrediente
      almacenId: $almacenId
      unidadMedida: $unidadMedida
      cantidadActual: $cantidadActual
      nivelMinimo: $nivelMinimo
      nivelMaximo: $nivelMaximo
    ) {
      ok
      error
      stock {
        id
        nombreIngrediente
        cantidadActual
        unidadMedida
      }
    }
  }
`;

export const AJUSTAR_STOCK = gql`
  mutation AjustarStock($id: ID!, $cantidad: Float!, $descripcion: String!) {
    ajustarStock(id: $id, cantidad: $cantidad, descripcion: $descripcion) {
      ok
      error
      stock {
        id
        cantidadActual
        porcentajeStock
        necesitaReposicion
        estaAgotado
      }
    }
  }
`;

// ── LOTES ─────────────────────────────────────────────────────────────────
export const REGISTRAR_LOTE = gql`
  mutation RegistrarLote(
    $ingredienteId: ID!
    $almacenId: ID!
    $proveedorId: ID!
    $numeroLote: String!
    $fechaVencimiento: String!
    $cantidadRecibida: Float!
    $unidadMedida: String!
    $fechaProduccion: String
  ) {
    registrarLote(
      ingredienteId: $ingredienteId
      almacenId: $almacenId
      proveedorId: $proveedorId
      numeroLote: $numeroLote
      fechaVencimiento: $fechaVencimiento
      cantidadRecibida: $cantidadRecibida
      unidadMedida: $unidadMedida
      fechaProduccion: $fechaProduccion
    ) {
      ok
      error
      lote {
        id
        numeroLote
        cantidadRecibida
        estado
        diasParaVencer
      }
    }
  }
`;

// ── ÓRDENES DE COMPRA ─────────────────────────────────────────────────────
export const CREAR_ORDEN_COMPRA = gql`
  mutation CrearOrdenCompra(
    $proveedorId: ID!
    $restauranteId: ID!
    $moneda: String!
    $detalles: [DetalleOrdenInput!]!
    $fechaEntregaEstimada: String
    $notas: String
  ) {
    crearOrdenCompra(
      proveedorId: $proveedorId
      restauranteId: $restauranteId
      moneda: $moneda
      detalles: $detalles
      fechaEntregaEstimada: $fechaEntregaEstimada
      notas: $notas
    ) {
      ok
      error
      orden {
        id
        estado
        totalEstimado
        moneda
      }
    }
  }
`;

export const ENVIAR_ORDEN_COMPRA = gql`
  mutation EnviarOrdenCompra($id: ID!) {
    enviarOrdenCompra(id: $id) {
      ok
      error
      orden {
        id
        estado
      }
    }
  }
`;

export const RECIBIR_ORDEN_COMPRA = gql`
  mutation RecibirOrdenCompra(
    $id: ID!
    $detalles: [DetalleRecepcionInput!]!
    $notas: String
  ) {
    recibirOrdenCompra(id: $id, detalles: $detalles, notas: $notas) {
      ok
      error
      orden {
        id
        estado
        fechaRecepcion
      }
    }
  }
`;

export const CANCELAR_ORDEN_COMPRA = gql`
  mutation CancelarOrdenCompra($id: ID!) {
    cancelarOrdenCompra(id: $id) {
      ok
      error
      orden {
        id
        estado
      }
    }
  }
`;

// ── ALERTAS ───────────────────────────────────────────────────────────────
export const RESOLVER_ALERTA = gql`
  mutation ResolverAlerta($id: ID!) {
    resolverAlerta(id: $id) {
      ok
      error
      alerta {
        id
        estado
        fechaResolucion
      }
    }
  }
`;

export const IGNORAR_ALERTA = gql`
  mutation IgnorarAlerta($id: ID!) {
    ignorarAlerta(id: $id) {
      ok
      error
      alerta {
        id
        estado
      }
    }
  }
`;
