// src/features/inventory/graphql/queries.js
// CAMBIO vs original: GET_STOCK agrega $restauranteId como parámetro opcional
// Todo lo demás es IDÉNTICO al original.

import { gql } from "@apollo/client";

// ── PROVEEDORES ───────────────────────────────────────────────────────────
export const GET_PROVEEDORES = gql`
  query GetProveedores(
    $activo: Boolean
    $pais: String
    $ciudad: String
    $alcance: String
  ) {
    proveedores(
      activo: $activo
      pais: $pais
      ciudad: $ciudad
      alcance: $alcance
    ) {
      id
      nombre
      pais
      ciudad
      telefono
      email
      monedaPreferida
      alcance
      paisDestino
      ciudadDestino
      creadoPorRestauranteId
      activo
      fechaCreacion
      fechaActualizacion
    }
  }
`;

export const GET_PROVEEDOR = gql`
  query GetProveedor($id: ID!) {
    proveedor(id: $id) {
      id
      nombre
      pais
      ciudad
      telefono
      email
      monedaPreferida
      activo
      fechaCreacion
      fechaActualizacion
    }
  }
`;

// ── ALMACENES ─────────────────────────────────────────────────────────────
export const GET_ALMACENES = gql`
  query GetAlmacenes($restauranteId: ID, $activo: Boolean) {
    almacenes(restauranteId: $restauranteId, activo: $activo) {
      id
      restauranteId
      nombre
      descripcion
      activo
      totalIngredientes
      ingredientesBajoMinimo
      fechaCreacion
      fechaActualizacion
    }
  }
`;

export const GET_ALMACEN = gql`
  query GetAlmacen($id: ID!) {
    almacen(id: $id) {
      id
      restauranteId
      nombre
      descripcion
      activo
      totalIngredientes
      ingredientesBajoMinimo
      fechaCreacion
      fechaActualizacion
    }
  }
`;

export const GET_STOCK_ALMACEN = gql`
  query GetStockAlmacen($almacenId: ID!, $bajoMinimo: Boolean) {
    stockAlmacen(almacenId: $almacenId, bajoMinimo: $bajoMinimo) {
      id
      ingredienteId
      nombreIngrediente
      almacen
      almacenNombre
      unidadMedida
      cantidadActual
      nivelMinimo
      nivelMaximo
      necesitaReposicion
      estaAgotado
      porcentajeStock
      fechaActualizacion
    }
  }
`;

// ── STOCK ─────────────────────────────────────────────────────────────────
export const GET_STOCK = gql`
  query GetStock(
    $almacenId: ID
    $restauranteId: ID
    $bajoMinimo: Boolean
    $agotado: Boolean
  ) {
    stock(
      almacenId: $almacenId
      restauranteId: $restauranteId
      bajoMinimo: $bajoMinimo
      agotado: $agotado
    ) {
      id
      ingredienteId
      nombreIngrediente
      almacen
      almacenNombre
      unidadMedida
      cantidadActual
      nivelMinimo
      nivelMaximo
      necesitaReposicion
      estaAgotado
      porcentajeStock
      fechaActualizacion
    }
  }
`;

export const GET_STOCK_ITEM = gql`
  query GetStockItem($id: ID!) {
    stockItem(id: $id) {
      id
      ingredienteId
      nombreIngrediente
      almacen
      almacenNombre
      unidadMedida
      cantidadActual
      nivelMinimo
      nivelMaximo
      necesitaReposicion
      estaAgotado
      porcentajeStock
      fechaActualizacion
      movimientos {
        id
        tipoMovimiento
        cantidad
        cantidadAntes
        cantidadDespues
        pedidoId
        ordenCompraId
        descripcion
        fecha
      }
    }
  }
`;

// ── LOTES ─────────────────────────────────────────────────────────────────
export const GET_LOTES = gql`
  query GetLotes($estado: String, $almacenId: ID, $porVencer: Int) {
    lotes(estado: $estado, almacenId: $almacenId, porVencer: $porVencer) {
      id
      ingredienteId
      almacen
      almacenNombre
      proveedor
      proveedorNombre
      numeroLote
      fechaProduccion
      fechaVencimiento
      cantidadRecibida
      cantidadActual
      unidadMedida
      estado
      estaVencido
      diasParaVencer
      fechaRecepcion
    }
  }
`;

// ── ÓRDENES DE COMPRA ─────────────────────────────────────────────────────
export const GET_ORDENES_COMPRA = gql`
  query GetOrdenesCompra(
    $estado: String
    $proveedorId: ID
    $restauranteId: ID
  ) {
    ordenesCompra(
      estado: $estado
      proveedorId: $proveedorId
      restauranteId: $restauranteId
    ) {
      id
      proveedor
      proveedorNombre
      restauranteId
      estado
      moneda
      totalEstimado
      fechaCreacion
      fechaEntregaEstimada
      fechaRecepcion
      notas
    }
  }
`;

export const GET_ORDEN_COMPRA = gql`
  query GetOrdenCompra($id: ID!) {
    ordenCompra(id: $id) {
      id
      proveedor
      proveedorNombre
      restauranteId
      estado
      moneda
      totalEstimado
      fechaCreacion
      fechaEntregaEstimada
      fechaRecepcion
      notas
      detalles {
        id
        ingredienteId
        nombreIngrediente
        unidadMedida
        cantidad
        cantidadRecibida
        precioUnitario
        subtotal
      }
    }
  }
`;

// ── ALERTAS ───────────────────────────────────────────────────────────────
export const GET_ALERTAS = gql`
  query GetAlertas($tipo: String, $estado: String, $restauranteId: ID) {
    alertasStock(tipo: $tipo, estado: $estado, restauranteId: $restauranteId) {
      id
      tipoAlerta
      estado
      ingredienteId
      nombreIngrediente
      restauranteId
      almacen
      almacenNombre
      nivelActual
      nivelMinimo
      lote
      fechaAlerta
      fechaResolucion
    }
  }
`;

// ── RECETAS ───────────────────────────────────────────────────────────────
export const GET_RECETAS = gql`
  query GetRecetas($platoId: ID) {
    recetas(platoId: $platoId) {
      id
      platoId
      ingredienteId
      nombreIngrediente
      cantidad
      unidadMedida
      costoUnitario
      costoIngrediente
      fechaActualizacion
    }
  }
`;

// ── COSTO DE PRODUCCIÓN ────────────────────────────────────────────────────
export const GET_COSTO_PLATO = gql`
  query GetCostoPlato($platoId: ID!, $restauranteId: ID) {
    costoPlato(platoId: $platoId, restauranteId: $restauranteId) {
      platoId
      costoTotal
      tieneCostosVacios
      porcionesDisponibles
      advertencia
      ingredientes {
        ingredienteId
        nombreIngrediente
        cantidadReceta
        unidadMedida
        costoUnitario
        costoIngrediente
        stockActual
        estaAgotado
        necesitaReposicion
        porcionesPosibles
        fechaCostoActualizado
      }
    }
  }
`;
