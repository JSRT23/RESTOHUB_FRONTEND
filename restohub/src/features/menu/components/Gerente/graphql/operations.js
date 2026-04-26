// src/features/menu/components/Gerente/graphql/operations.js
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

// ── Ingredientes disponibles para asignar a un plato ─────────────────────
// "disponibles=UUID" → globales + propios del restaurante.
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

// ── Platos del restaurante (lista) ───────────────────────────────────────
// Usa restauranteId — el backend devuelve campos básicos sin ingredientes
// ni precios. Los precios se obtienen por separado con GET_PRECIOS_RESTAURANTE
// y se cruzan en JS por platoId.
export const GET_PLATOS_GERENTE = gql`
  query GetPlatosGerente(
    $restauranteId: ID!
    $activo: Boolean
    $categoriaId: ID
  ) {
    platos(
      restauranteId: $restauranteId
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
// Devuelve platoId → se cruza con platos en JS para obtener precio vigente.
// Se usa en GPlatosList, GerenteDashboard y refetchQueries de mutaciones de precio.
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
// plato(id) devuelve PlatoSerializer completo — con ingredientes y precios.
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

// ── Platos disponibles para mesero (globales + del restaurante) ───────────
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
