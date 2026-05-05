import { gql } from "@apollo/client";

export const MUTATION_LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      ok
      error
      codigo
      payload {
        accessToken
        refreshToken
        expiresIn
        usuario {
          id
          email
          nombre
          rol
          activo
          emailVerificado
        }
      }
    }
  }
`;

export const MUTATION_AUTO_REGISTRO = gql`
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

export const MUTATION_VERIFICAR_CODIGO = gql`
  mutation VerificarCodigo($email: String!, $codigo: String!) {
    verificarCodigo(email: $email, codigo: $codigo) {
      ok
      error
      codigoError
      intentosRestantes
    }
  }
`;

export const MUTATION_REENVIAR_CODIGO = gql`
  mutation ReenviarCodigo($email: String!) {
    reenviarCodigo(email: $email) {
      ok
      error
    }
  }
`;

export const QUERY_ME = gql`
  query Me {
    me {
      id
      email
      nombre
      rol
      activo
      emailVerificado
    }
  }
`;
