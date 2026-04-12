// src/features/menu/components/Gerente/graphql/operations.js
// Queries y mutations del GERENTE_LOCAL.
// Todas las operaciones están scoped al restauranteId del JWT del gerente.
// El componente debe pasar siempre restauranteId — nunca omitirlo.
import { gql } from "@apollo/client";

// ── Restaurante propio ─────────────────────────────────────────────────────

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
// El gerente no puede crear ni editar categorías — solo asignarlas a sus platos.

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

// ── Ingredientes del restaurante ──────────────────────────────────────────
// restauranteId es REQUERIDO — filtra solo los ingredientes de este restaurante.
// Sin restauranteId devolverías ingredientes globales mezclados con los locales,
// lo que rompería el scope del gerente.

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

// Ingredientes disponibles para asignar a un plato (wizard y detalle de plato).
// Usa "disponibles" para traer globales + propios del restaurante.
// disponibles es REQUERIDO — siempre se pasa el restauranteId del gerente.

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

// ── Mutations — Ingredientes ───────────────────────────────────────────────

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

// actualizarIngrediente solo acepta nombre y descripcion.
// La unidadMedida NO es modificable una vez creado el ingrediente.
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

// ── Queries — Platos del restaurante ──────────────────────────────────────

// Lista de platos del restaurante — restauranteId es REQUERIDO.
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

// ── Mutations — Platos ─────────────────────────────────────────────────────

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

// ── Mutations — Precios ────────────────────────────────────────────────────

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
