import { gql } from "@apollo/client";

export const GET_RESTAURANTES = gql`
  query GetRestaurantes($activo: Boolean, $pais: String) {
    restaurantes(activo: $activo, pais: $pais) {
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

export const GET_CATEGORIAS = gql`
  query GetCategorias {
    categorias(activo: true) {
      id
      nombre
      orden
      activo
    }
  }
`;
