# 🖥️ RestoHub — Frontends

Tres aplicaciones React + Vite que consumen el gateway GraphQL de [RESTOHUB_BACKEND](https://github.com/JSRT23/RESTOHUB_BACKEND).

| App | Puerto dev | Para qué | Variable de API |
|---|---|---|---|
| `restohub/` | 5173 | Panel principal del restaurante | `VITE_API_URL` |
| `portal_empleados/` | 5174 | Portal de empleados | `VITE_API_URL` |
| `restohub_app/` | 5175 | App para clientes: restaurantes, carrito, pedidos, puntos y cupones, pago con Mercado Pago | `VITE_GATEWAY_URL` |

El gateway por defecto está en `http://localhost:8000/api/graphql/`.

## Cómo correrlo

### Con Docker

Primero levanta el backend (crea la red `restohub_backend_restohub_network`). Luego:

```bash
git clone https://github.com/JSRT23/RESTOHUB_FRONTEND.git
cd RESTOHUB_FRONTEND
docker compose -f docker-compose.frontend.yml up --build
```

> El compose actual cubre `restohub` y `portal_empleados`; `restohub_app` se corre sin Docker por ahora.

### Sin Docker

```bash
cd restohub            # o portal_empleados / restohub_app
npm ci
npm run dev
```

En `restohub_app` renombra el archivo de ejemplo a `.env.development` con `VITE_GATEWAY_URL`.

El `Dockerfile` de la raíz y el compose existentes no se modificaron.
