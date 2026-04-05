import { gql } from "@apollo/client";

export const CREATE_RESTAURANTE = gql`
  mutation CrearRestaurante(
    $nombre: String!
    $pais: String!
    $direccion: String!
    $ciudad: String!
    $moneda: String!
  ) {
    crearRestaurante(
      nombre: $nombre
      pais: $pais
      direccion: $direccion
      ciudad: $ciudad
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
