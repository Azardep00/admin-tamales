# Panel de operación — Tamales y Lechona

Frontend administrativo del backend Spring Boot. Cubre todos los endpoints
expuestos por la API.

## Instalación

```bash
npm install
npm install react-router-dom
cp .env.example .env     # en PowerShell: copy .env.example .env
npm run dev
```

## Requisito en el backend

`CorsConfig.java` debe permitir PATCH, o el cambio de estado de un pedido
y el cambio de contraseña fallan en el preflight:

```java
.allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
```

## Qué hay en cada sección

| Sección     | Endpoints que consume                                                     |
|-------------|---------------------------------------------------------------------------|
| Acceso      | `POST /api/usuarios/login` (solo entran usuarios de tipo Empleado)        |
| Resumen     | pedidos, productos y movimientos; además `GET /api/integracion/clima`     |
| Pedidos     | listar, filtrar por estado o cliente, detalle, crear, avanzar, cancelar   |
| Productos   | listar, buscar, crear tamal o lechona, editar, retirar                    |
| Inventario  | listar y filtrar movimientos, registrar entrada, salida y reversión       |
| Proveedores | listar, buscar, registrar, editar, desactivar                             |
| Personas    | clientes y empleados: listar, crear, editar, cambiar contraseña, desactivar |

## Estructura

```
src/
  api/          client.js (fetch + errores) e index.js (un método por endpoint)
  lib/          formato de moneda y fechas, hooks de carga
  context/      sesión y avisos
  components/   layout y piezas de interfaz reutilizables
  pages/        una por sección
  styles.css    sistema visual completo
```

## Límites que vienen de la API

- No existe endpoint para reactivar un producto, proveedor o usuario dado de baja.
- `PUT /api/productos/{id}` ignora stock y estado: el stock se mueve por inventario.
- El backend acepta un solo filtro a la vez en pedidos y movimientos.
- El login no devuelve token; la sesión se guarda en el navegador y el filtro
  por rol es del lado del cliente.
