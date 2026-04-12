// src/features/menu/components/admin/graphql/mutations.js
// Mutations del ADMIN_CENTRAL para ingredientes, platos y precios.
// El admin puede crear ingredientes/platos globales (restauranteId=null)
// o scoped a un restaurante específico pasando restauranteId.
// Las mutations de restaurante están en operations.js
// Las mutations de categorías están en categorias.operations.js
import { gql } from "@apollo/client";

// ── INGREDIENTE ────────────────────────────────────────────────────────────

export const CREAR_INGREDIENTE = gql`
  mutation CrearIngrediente(
    $nombre: String!
    $unidadMedida: String!
    $descripcion: String
    $restauranteId: ID
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
        unidadMedida
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

// ── PLATO ──────────────────────────────────────────────────────────────────

export const CREAR_PLATO = gql`
  mutation CrearPlato(
    $nombre: String!
    $descripcion: String!
    $categoriaId: ID
    $imagen: String
    $restauranteId: ID
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

// ── PRECIO ─────────────────────────────────────────────────────────────────

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
