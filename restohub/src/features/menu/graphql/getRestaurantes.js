import { gql } from "@apollo/client";

export const GET_RESTAURANTES = gql`
  query {
    restaurantes {
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
