# Prospecta — Prospección de negocios + CRM

App web local para una agencia de software: encuentra negocios **sin sitio web**
dentro de un área dibujada en el mapa y gestiónalos como prospectos de venta.

## Stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS**
- **MySQL** + **Prisma ORM**
- **Leaflet.js** + **Leaflet.draw** (mapa con OpenStreetMap)
- **Google Places API (New)**

## Puesta en marcha

```bash
npm install        # instala dependencias y genera el cliente Prisma
# Edita DATABASE_URL en .env con tu conexión MySQL antes del siguiente paso
npm run db:push    # crea las tablas en tu base de datos MySQL
npm run dev        # arranca en http://localhost:3000
```

> **Base de datos:** la conexión MySQL se configura en `DATABASE_URL` (archivo `.env`),
> con el formato `mysql://usuario:contraseña@host:puerto/nombre_db`.

La **primera vez** que abras la app te pedirá tu **Google Places API key**.
Se guarda localmente en `.env.local` (ignorado por git). Puedes cambiarla luego
con el icono de engranaje en la barra superior.

### Cómo obtener la API key

1. Entra a [Google Cloud Console](https://console.cloud.google.com/) y crea/elige un proyecto.
2. Habilita **Places API (New)** en la biblioteca de APIs.
3. En *Credenciales*, crea una **Clave de API**.
4. (Recomendado) Restringe la clave a Places API.

## Cómo funciona

### 1. Mapa + búsqueda (`/map`)

1. Dibuja un polígono con la herramienta de área (arriba a la derecha del mapa).
2. Elige una categoría (opcional) y pulsa **Buscar en el área**.
3. La app calcula el **círculo envolvente mínimo** del polígono (`lib/geo.ts`),
   llama a **Nearby Search** con ese centro + radio, y luego:
   - filtra los resultados que caen **dentro del polígono real** (punto-en-polígono),
   - se queda solo con los que **no tienen sitio web**.
4. Revisa los resultados e **importa** los nuevos al CRM (dedup por `placeId`).

> **Nota sobre llamadas a la API:** usamos la Places API *(New)*, que devuelve
> teléfono, web y horarios en la **misma** llamada Nearby Search. Así una búsqueda
> = **1 llamada** facturable (en lugar de 1 + N de Place Details). El contador de
> la barra superior lleva la cuenta de la sesión para no salirte de la capa
> gratuita (USD $200/mes).

### 2. CRM (`/crm`)

Tabla de prospectos con seguimiento de:

- **Contacto:** Sin contactar → Contactado → En negociación → Cerrado → Descartado
  (+ canal: llamada / WhatsApp / email, fecha de último contacto, notas).
- **Propuesta:** Sin enviar → Enviada → Vista → Aceptada → Rechazada
  (+ valor y fecha de envío).

Filtra por estado, categoría y zona; busca por nombre; edita todo desde el panel
lateral. El botón *"Actualizar desde Google"* re-consulta Place Details (1 llamada).

## Estructura

```
app/
  page.tsx              Panel/dashboard
  map/page.tsx          Mapa + búsqueda
  crm/page.tsx          CRM
  api/
    config/             GET/POST de la API key
    places/search/      Nearby Search + filtros
    prospects/          listar / importar / editar / eliminar / refrescar
components/             UI (mapa, tabla, editor, badges…)
lib/
  geo.ts                bounding circle + punto-en-polígono
  places.ts             cliente Google Places (New)
  prisma.ts, constants.ts, apiKey.ts, ...
prisma/schema.prisma    modelos (MySQL)
```

## Scripts

| Script              | Acción                              |
| ------------------- | ----------------------------------- |
| `npm run dev`       | Servidor de desarrollo              |
| `npm run build`     | Build de producción                 |
| `npm run start`     | Servir el build                     |
| `npm run db:push`   | Sincronizar el esquema con MySQL    |
| `npm run db:studio` | Abrir Prisma Studio (ver/editar BD) |
