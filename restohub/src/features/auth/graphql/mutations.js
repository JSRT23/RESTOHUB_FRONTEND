// src/features/auth/graphql/mutations.js
import { gql } from "@apollo/client";

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      ok
      error
      codigo
      payload {
        accessToken
        refreshToken
        tokenType
        expiresIn
        usuario {
          id
          email
          nombre
          rol
          restauranteId
          empleadoId
          activo
          emailVerificado
        }
      }
    }
  }
`;

export const VERIFICAR_CODIGO_MUTATION = gql`
  mutation VerificarCodigo($email: String!, $codigo: String!) {
    verificarCodigo(email: $email, codigo: $codigo) {
      ok
      error
      codigoError
      intentosRestantes
    }
  }
`;

export const REENVIAR_CODIGO_MUTATION = gql`
  mutation ReenviarCodigo($email: String!) {
    reenviarCodigo(email: $email) {
      ok
      error
    }
  }
`;

export const AUTO_REGISTRO_MUTATION = gql`
  mutation AutoRegistro(
    $email: String!
    $nombre: String!
    $password: String!
    $passwordConfirm: String!
  ) {
    autoRegistro(
      email: $email
      nombre: $nombre
      password: $password
      passwordConfirm: $passwordConfirm
    ) {
      ok
      error
      emailEnviado
      codigoDev
    }
  }
`;
