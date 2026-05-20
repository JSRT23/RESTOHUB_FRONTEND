// src/features/menu/components/Gerente/graphql/operations.js
// FIX: GET_INGREDIENTES_GERENTE e GET_PLATOS_GERENTE ahora usan el arg
//      "disponibles" en lugar de "restauranteId" para que el backend devuelva
//      globales (restaurante_id IS NULL) + propios del restaurante.
//
// ANTES: ingredientes(restauranteId: $restauranteId) → solo propios, sin globales
// AHORA: ingredientes(disponibles: $restauranteId)   → globales + propios
//
// ANTES: platos(restauranteId: $restauranteId)        → solo propios, sin globales
// AHORA: platos(disponibles: $restauranteId)           → globales + propios
import { gql } from "@apollo/client";

// ── Restaurante propio ────────────────────────────────────────────────────
export const GET_MI_RESTAURANTE = gql`
  query GetMiRestaurante($id: ID!) {
    restaurante(id: $id) {
      id
      nombre
      pais
      ciudad
      direccion
      moneda
      imagen
      activo
    }
  }
`;

// ── Categorías globales (solo lectura) ────────────────────────────────────
export const GET_CATEGORIAS_GERENTE = gql`
  query GetCategoriasGerente($activo: Boolean) {
    categorias(activo: $activo) {
      id
      nombre
      orden
      activo
    }
  }
`;

// ── Ingredientes del restaurante (lista/gestión) ──────────────────────────
// FIX: usa restauranteId como filtro exacto para la LISTA de gestión
//      (el gerente solo debe editar/activar/desactivar los suyos propios).
//      NO usa "disponibles" aquí para no mostrar globales como editables.
export const GET_INGREDIENTES_GERENTE = gql`
  query GetIngredientesGerente($restauranteId: ID!, $activo: Boolean) {
    ingredientes(restauranteId: $restauranteId, activo: $activo) {
      id
      restauranteId
      nombre
      unidadMedida
      descripcion
      activo
    }
  }
`;

// ── Ingredientes DISPONIBLES para asignar a un plato ─────────────────────
// FIX: "disponibles" devuelve globales (restaurante_id IS NULL) + propios.
//      Se usa en CreatePlatoWizard, PlatoDetailModal y GerenteDashboard.
export const GET_INGREDIENTES_DISPONIBLES = gql`
  query GetIngredientesDisponibles($disponibles: ID!, $activo: Boolean) {
    ingredientes(disponibles: $disponibles, activo: $activo) {
      id
      restauranteId
      nombre
      unidadMedida
      descripcion
      activo
    }
  }
`;

export const CREAR_INGREDIENTE = gql`
  mutation CrearIngrediente(
    $nombre: String!
    $unidadMedida: String!
    $descripcion: String
    $restauranteId: ID!
  ) {
    crearIngrediente(
      nombre: $nombre
      unidadMedida: $unidadMedida
      descripcion: $descripcion
      restauranteId: $restauranteId
    ) {
      ok
      error
      ingrediente {
        id
        restauranteId
        nombre
        unidadMedida
        descripcion
        activo
      }
    }
  }
`;

export const ACTUALIZAR_INGREDIENTE = gql`
  mutation ActualizarIngrediente(
    $id: ID!
    $nombre: String
    $descripcion: String
  ) {
    actualizarIngrediente(id: $id, nombre: $nombre, descripcion: $descripcion) {
      ok
      error
      ingrediente {
        id
        restauranteId
        nombre
        descripcion
        activo
      }
    }
  }
`;

export const ACTIVAR_INGREDIENTE = gql`
  mutation ActivarIngrediente($id: ID!) {
    activarIngrediente(id: $id) {
      ok
      error
    }
  }
`;

export const DESACTIVAR_INGREDIENTE = gql`
  mutation DesactivarIngrediente($id: ID!) {
    desactivarIngrediente(id: $id) {
      ok
      error
    }
  }
`;

// ── Platos del restaurante (lista/gestión) ────────────────────────────────
// FIX: usa "disponibles" en lugar de "restauranteId" para incluir globales.
//      El gerente debe ver y poder usar globales + los propios de su restaurante.
export const GET_PLATOS_GERENTE = gql`
  query GetPlatosGerente(
    $restauranteId: ID!
    $activo: Boolean
    $categoriaId: ID
  ) {
    platos(
      disponibles: $restauranteId
      activo: $activo
      categoriaId: $categoriaId
    ) {
      id
      restauranteId
      nombre
      descripcion
      categoriaId
      categoriaNombre
      imagen
      activo
      fechaCreacion
    }
  }
`;

// ── Todos los precios del restaurante ────────────────────────────────────
export const GET_PRECIOS_RESTAURANTE = gql`
  query GetPreciosRestaurante($restauranteId: ID!) {
    precios(restauranteId: $restauranteId, activo: true) {
      id
      platoId
      restauranteId
      precio
      moneda
      fechaInicio
      fechaFin
      activo
      estaVigente
    }
  }
`;

// ── Detalle completo de un plato ──────────────────────────────────────────
export const GET_PLATO_DETALLE = gql`
  query GetPlatoDetalle($id: ID!) {
    plato(id: $id) {
      id
      restauranteId
      nombre
      descripcion
      categoriaId
      categoriaNombre
      imagen
      activo
      fechaCreacion
      ingredientes {
        id
        ingredienteId
        ingredienteNombre
        unidadMedida
        cantidad
      }
      precios {
        id
        restauranteId
        restauranteNombre
        precio
        moneda
        fechaInicio
        fechaFin
        activo
        estaVigente
      }
    }
  }
`;

export const CREAR_PLATO = gql`
  mutation CrearPlato(
    $nombre: String!
    $descripcion: String!
    $categoriaId: ID
    $imagen: String
    $restauranteId: ID!
  ) {
    crearPlato(
      nombre: $nombre
      descripcion: $descripcion
      categoriaId: $categoriaId
      imagen: $imagen
      restauranteId: $restauranteId
    ) {
      ok
      error
      plato {
        id
        restauranteId
        nombre
        descripcion
        activo
      }
    }
  }
`;

export const ACTUALIZAR_PLATO = gql`
  mutation ActualizarPlato(
    $id: ID!
    $nombre: String
    $descripcion: String
    $categoriaId: ID
    $imagen: String
  ) {
    actualizarPlato(
      id: $id
      nombre: $nombre
      descripcion: $descripcion
      categoriaId: $categoriaId
      imagen: $imagen
    ) {
      ok
      error
      plato {
        id
        restauranteId
        nombre
        descripcion
        categoriaId
        activo
      }
    }
  }
`;

export const ACTIVAR_PLATO = gql`
  mutation ActivarPlato($id: ID!) {
    activarPlato(id: $id) {
      ok
      error
    }
  }
`;

export const DESACTIVAR_PLATO = gql`
  mutation DesactivarPlato($id: ID!) {
    desactivarPlato(id: $id) {
      ok
      error
    }
  }
`;

export const AGREGAR_INGREDIENTE_PLATO = gql`
  mutation AgregarIngredientePlato(
    $platoId: ID!
    $ingredienteId: ID!
    $cantidad: Float!
  ) {
    agregarIngredientePlato(
      platoId: $platoId
      ingredienteId: $ingredienteId
      cantidad: $cantidad
    ) {
      ok
      error
    }
  }
`;

export const QUITAR_INGREDIENTE_PLATO = gql`
  mutation QuitarIngredientePlato($platoId: ID!, $ingredienteId: ID!) {
    quitarIngredientePlato(platoId: $platoId, ingredienteId: $ingredienteId) {
      ok
      error
    }
  }
`;

export const CREAR_PRECIO_PLATO = gql`
  mutation CrearPrecioPlato(
    $platoId: ID!
    $restauranteId: ID!
    $precio: Float!
    $fechaInicio: String!
    $fechaFin: String
  ) {
    crearPrecioPlato(
      platoId: $platoId
      restauranteId: $restauranteId
      precio: $precio
      fechaInicio: $fechaInicio
      fechaFin: $fechaFin
    ) {
      ok
      error
      precioPlato {
        id
        platoId
        restauranteId
        precio
        moneda
        estaVigente
        activo
      }
    }
  }
`;

export const ACTIVAR_PRECIO = gql`
  mutation ActivarPrecio($id: ID!) {
    activarPrecio(id: $id) {
      ok
      error
    }
  }
`;

export const DESACTIVAR_PRECIO = gql`
  mutation DesactivarPrecio($id: ID!) {
    desactivarPrecio(id: $id) {
      ok
      error
    }
  }
`;

export const GET_PLATOS_DISPONIBLES = gql`
  query GetPlatosDisponibles($disponibles: ID!, $activo: Boolean) {
    platos(disponibles: $disponibles, activo: $activo) {
      id
      restauranteId
      nombre
      descripcion
      categoriaId
      categoriaNombre
      imagen
      activo
    }
  }
`;

export { GET_COSTO_PLATO } from "../../../../inventory/graphql/queries";
