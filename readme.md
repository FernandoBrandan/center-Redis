
Sistema de caché distribuido usando Redis
Integrado con API Gateway para gestión centralizada de tráfico
Acelera respuestas API en microservicios hasta 100x
Mecanismos atómicos para transacciones críticas

> [Código fuente](https://github.com/FernandoBrandan/api-PaymentService)

## Flujo principal:

- Caching Layer (getAllItems):

  - Consulta primero en Redis (HSET con clave principal redis)
  - Cache-miss dispara repoblación automática desde DB
  - TTL automático: 1 hora con EXPIRE

- Repoblación (populate):

  - Pipeline Redis para operaciones batch
  - Estandarización de datos

- Gestión de Inventario a traves de order de compra (purchase):
  - Patrón Optimistic Locking con SET lock:item_id UUID
  - Validación en DB real antes de actualizar
  - Cola asíncrona para actualizaciones de stock
  - Transacciones atómicas usando MULTI/EXEC

## Tecnologías:

- Redis 7+ (Hashes, Locks, TTL, Pipeline)
- TypeScript/Node.js
- MySQL
- Arquitectura Event-Driven (cola Redis para updates)
 

Uso en producción:

```bash
# Obtener todos los ítems
GET /api/items

# Forzar repoblación de cache
POST /api/populate

# Proceso de compra atómico
POST /api/purchase
{
    "items": [
            { "source_api": "inventory", "iditem": "123", "quantity": 2 }
        ]
}
```
