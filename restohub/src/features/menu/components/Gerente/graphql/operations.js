// src/features/gerente/graphql/operations.js
// Queries y mutations del gerente_local — menu_service + staff_service
import { gql } from "@apollo/client";

// ── Restaurante propio (del JWT restauranteId) ────────────────────────────
export const GET_MI_RESTAURANTE = gql`
  query GetMiRestaurante($id: ID!) {
    restaurante(id: $id) {
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

// ── Categorías globales (solo lectura para el gerente) ────────────────────
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

// ── Ingredientes (el gerente crea los locales de su restaurante) ──────────
export const GET_INGREDIENTES_GERENTE = gql`
  query GetIngredientesGerente($activo: Boolean) {
    ingredientes(activo: $activo) {
      id
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
  ) {
    crearIngrediente(
      nombre: $nombre
      unidadMedida: $unidadMedida
      descripcion: $descripcion
    ) {
      ok
      error
      ingrediente {
        id
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

// ── Platos ────────────────────────────────────────────────────────────────
export const GET_PLATOS_GERENTE = gql`
  query GetPlatosGerente($activo: Boolean, $categoriaId: ID) {
    platos(activo: $activo, categoriaId: $categoriaId) {
      id
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
        precio
        moneda
        fechaInicio
        activo
        estaVigente
      }
    }
  }
`;

export const GET_PLATO_DETALLE = gql`
  query GetPlatoDetalle($id: ID!) {
    plato(id: $id) {
      id
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
  ) {
    crearPlato(
      nombre: $nombre
      descripcion: $descripcion
      categoriaId: $categoriaId
      imagen: $imagen
    ) {
      ok
      error
      plato {
        id
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

// ── Precios ───────────────────────────────────────────────────────────────
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
