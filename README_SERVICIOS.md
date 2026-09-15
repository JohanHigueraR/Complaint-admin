# Cómo agregar servicios

Esta app usa un layer de servicios por dominio. El frontend depende de los contratos, no de la implementación.

## Estructura actual

Para el estado real de qué existe hoy (y qué falta) ver [`services/README.md`](./services/README.md) — ahí se mantiene actualizado. Resumen: `config.ts`, `service-provider.ts` y `service-error.ts` ya existen y `lib/store.ts` los usa de verdad (`complaintsService`/`notificationsService`, switch por `NEXT_PUBLIC_DATA_SOURCE`); `http-client.ts` tiene una implementación real mínima; `contracts/` (7 de 9), `mock/` (5 de 7, los dos que usa el store completos) y `api/` (los 7 correspondientes a los contratos existentes, con ejemplo de NestJS comentado en cada uno). `services/client.ts` **todavía no existe** (créenlo si hace falta, ver paso 3 de abajo).

Default: `NEXT_PUBLIC_DATA_SOURCE=mock`.

## Pasos para agregar un servicio

1. Registrar contrato
2. Implementar mock
3. Agregar al proveedor
4. (Opcional) Implementar api/ después

### 1. Contrato

Archivo: `services/contracts/<nombre>.service.ts`

Define una clase o interfaz con método asíncrono:

```ts
export interface XxxService {
  list(): Promise<XxxItem[]>;
  getById(id: string): Promise<XxxItem | null>;
  doSomething(...): Promise<void>;
}
```

Criterio: representa operaciones de datos/negocio. No importa nada de React/components.

### 2. Mock

Archivo: `services/mock/mock-<nombre>.service.ts`

```ts
import type { XxxService } from "../contracts/<nombre>.service";

export class MockXxxService implements XxxService {
  async list() { /* usa datos locales */ }
  async getById(id) { /* usa datos locales */ }
}
```

No importes mocks directamente desde componentes. Usa el servicio mock como única fuente por ahora.

### 3. Registrar en el proveedor

Archivo: `services/service-provider.ts` (ya existe, con `complaintsService`/`notificationsService`/`advisorsService` — agrega ahí la entrada de tu servicio nuevo).

Agrega la entrada correspondiente y úsala desde el store/compartido:

```ts
const complaintsService =
  DATA_SOURCE === "mock"
    ? new MockComplaintsService()
    : new ApiComplaintsService();
```

### 4. API (más adelante)

Archivo sugerido: `services/api/<nombre>.service.ts`

```ts
export class ApiXxxService implements XxxService {
  private client = httpClient;
  async list() { /* implementar con fetch/axios */ }
}
```

No inventes endpoints todavía. Solo cumple el contrato.

## Cambiar mock → api

Solo se cambia `NEXT_PUBLIC_DATA_SOURCE` o la clave de configuración equivalente.

No se tocan componentes ni store mientras los contratos se cumplan.
