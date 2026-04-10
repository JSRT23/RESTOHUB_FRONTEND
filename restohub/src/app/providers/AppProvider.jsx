// src/app/providers/AppProvider.jsx
import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
} from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { AuthProvider } from "../auth/AuthContext";

// Apollo link que inyecta el JWT en cada request
const authLink = new ApolloLink((operation, forward) => {
  const token = localStorage.getItem("restohub_access_token");
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }));
  return forward(operation);
});

const httpLink = new HttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL || "http://localhost:8000/api/graphql/",
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: "cache-and-network" },
  },
});

export default function AppProvider({ children }) {
  return (
    <AuthProvider>
      <ApolloProvider client={client}>{children}</ApolloProvider>
    </AuthProvider>
  );
}
