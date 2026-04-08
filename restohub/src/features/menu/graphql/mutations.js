// src/features/menu/graphql/mutations.js
import { gql } from "@apollo/client";

// ── RESTAURANTE ───────────────────────────────────────────────────────────
export const CREATE_RESTAURANTE = gql`
  mutation CrearRestaurante(
    $nombre: String!
    $pais: String!
    $ciudad: String!
    $direccion: String!
    $moneda: String!
  ) {
    crearRestaurante(
      nombre: $nombre
      pais: $pais
      ciudad: $ciudad
      direccion: $direccion
      moneda: $moneda
    ) {
      ok
      error
      restaurante {
        id
        nombre
      }
    }
  }
`;
export const ACTUALIZAR_RESTAURANTE = gql`
  mutation ActualizarRestaurante(
    $id: ID!
    $nombre: String
    $pais: String
    $ciudad: String
    $direccion: String
    $moneda: String
  ) {
    actualizarRestaurante(
      id: $id
      nombre: $nombre
      pais: $pais
      ciudad: $ciudad
      direccion: $direccion
      moneda: $moneda
    ) {
      ok
      error
      restaurante {
        id
        nombre
        ciudad
        pais
        moneda
        activo
      }
    }
  }
`;
export const ACTIVAR_RESTAURANTE = gql`
  mutation ActivarRestaurante($id: ID!) {
    activarRestaurante(id: $id) {
      ok
      error
    }
  }
`;
export const DESACTIVAR_RESTAURANTE = gql`
  mutation DesactivarRestaurante($id: ID!) {
    desactivarRestaurante(id: $id) {
      ok
      error
    }
  }
`;

// ── CATEGORÍA ─────────────────────────────────────────────────────────────
export const CREATE_CATEGORIA = gql`
  mutation CrearCategoria($nombre: String!, $orden: Int) {
    crearCategoria(nombre: $nombre, orden: $orden) {
      ok
      error
      categoria {
        id
        nombre
        orden
        activo
      }
    }
  }
`;
export const ACTUALIZAR_CATEGORIA = gql`
  mutation ActualizarCategoria($id: ID!, $nombre: String, $orden: Int) {
    actualizarCategoria(id: $id, nombre: $nombre, orden: $orden) {
      ok
      error
      categoria {
        id
        nombre
        orden
        activo
      }
    }
  }
`;
export const DESACTIVAR_CATEGORIA = gql`
  mutation DesactivarCategoria($id: ID!) {
    desactivarCategoria(id: $id) {
      ok
      error
    }
  }
`;

// ── INGREDIENTE ───────────────────────────────────────────────────────────
export const CREATE_INGREDIENTE = gql`
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
        activo
      }
    }
  }
`;

// ── PLATO ─────────────────────────────────────────────────────────────────
export const CREATE_PLATO = gql`
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

// ── PRECIO ────────────────────────────────────────────────────────────────
export const CREATE_PRECIO = gql`
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
