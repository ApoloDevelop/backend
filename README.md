# APOLO Backend

## 📋 Descripción General

APOLO es una aplicación backend desarrollada con **NestJS** que proporciona una API RESTful para una plataforma de música social. El sistema permite a los usuarios descubrir música, crear reseñas, gestionar listas de reproducción, y socializar alrededor del contenido musical.

## 🏗️ Arquitectura General

### Stack Tecnológico

- **Framework**: NestJS (Node.js)
- **Base de Datos**: MySQL con Prisma ORM
- **Autenticación**: JWT + OAuth (Google, Spotify, Apple)
- **Almacenamiento de archivos**: Cloudinary
- **Validación**: class-validator + class-transformer
- **APIs Externas**: Spotify, MusicBrainz, Genius, OpenAI

### Estructura del Proyecto

```
src/
├── main.ts                 # Punto de entrada de la aplicación
├── app.module.ts           # Módulo raíz que importa todos los módulos
├── auth/                   # Autenticación y autorización
├── users/                  # Gestión de usuarios
├── prisma/                 # Configuración de Prisma ORM
├── activity/               # Sistema de actividad de usuarios
├── articles/               # Gestión de artículos/noticias
├── cloudinary/             # Integración con Cloudinary
├── comments/               # Sistema de comentarios
├── email/                  # Servicio de correo electrónico
├── favorites/              # Gestión de favoritos
├── genius/                 # Integración con Genius API
├── geo/                    # Servicios geográficos
├── item/                   # Entidades musicales (álbumes, canciones, artistas)
├── lists/                  # Listas de reproducción personalizadas
├── musicbrainz/           # Integración con MusicBrainz API
├── notifications/          # Sistema de notificaciones
├── reviews/               # Sistema de reseñas y calificaciones
├── songstats/             # Estadísticas de canciones
├── spotify/               # Integración con Spotify API
└── common/                # Utilidades compartidas
```

## 🔧 Componentes Principales

### 1. **Módulo de Autenticación (`auth/`)**

- **Propósito**: Gestiona el registro, login y autenticación de usuarios
- **Características**:
  - Autenticación JWT
  - OAuth con Google, Spotify y Apple
  - Reset de contraseñas por email
  - Guards para proteger rutas
  - Decoradores personalizados para roles

### 2. **Módulo de Usuarios (`users/`)**

- **Propósito**: CRUD de usuarios y gestión de perfiles
- **Características**:
  - Perfiles de usuario completos
  - Configuraciones de privacidad
  - Información social (género, biografía, enlaces)
  - Geolocalización

### 3. **Módulo de Items (`item/`)**

- **Propósito**: Gestión de entidades musicales
- **Características**:
  - Álbumes, canciones y artistas
  - Resolución de metadatos musicales
  - Integración con APIs externas

### 4. **Módulo de Reseñas (`reviews/`)**

- **Propósito**: Sistema de calificaciones y reseñas
- **Características**:
  - Calificaciones numéricas
  - Reseñas textuales
  - Estadísticas agregadas

### 5. **Módulo de Listas (`lists/`)**

- **Propósito**: Listas de reproducción personalizadas
- **Características**:
  - Creación y gestión de listas
  - Compartir listas públicas/privadas
  - Colaboración en listas

### 6. **Módulo de Favoritos (`favorites/`)**

- **Propósito**: Sistema de marcado como favorito
- **Características**:
  - Favoritos de canciones, álbumes y artistas
  - Gestión de favoritos por usuario

### 7. **Módulo de Artículos (`articles/`)**

- **Propósito**: Gestión de artículos y noticias musicales
- **Características**:
  - Publicación de artículos por usuarios autorizados
  - Sistema de etiquetas (tags)
  - Comentarios en artículos
  - Contador de visualizaciones
  - Gestión de imágenes asociadas

### 8. **Integraciones Externas**

- **Spotify** (`spotify/`): Búsqueda de música, metadatos, autenticación OAuth
- **MusicBrainz** (`musicbrainz/`): Base de datos abierta de música
- **Genius** (`genius/`): Letras de canciones y información adicional
- **Cloudinary** (`cloudinary/`): Almacenamiento y procesamiento de imágenes

## 🗄️ Base de Datos

### Modelo de Datos Principal

```
User (usuarios)
├── Articles (artículos/noticias)
├── Reviews (reseñas)
├── Lists (listas de reproducción)
├── Favorites (favoritos)
├── Comments (comentarios)
├── Activity (actividad)
└── Notifications (notificaciones)

Item (entidades musicales)
├── Album
├── Song
├── Artist
└── Genre
```

### Tecnología de Base de Datos

- **ORM**: Prisma
- **Motor**: MySQL
- **Migraciones**: Gestionadas con Prisma Migrate
- **Generación de tipos**: Automática con Prisma Client

## 🔐 Seguridad

### Autenticación

- **JWT Tokens**: Para autenticación stateless
- **OAuth 2.0**: Integración con proveedores externos
- **Password Hashing**: bcryptjs para hash seguro de contraseñas

### Autorización

- **Guards**: Protección de rutas sensibles
- **Roles**: Sistema de roles y permisos
- **Decoradores**: `@CurrentUser()`, `@Roles()` para facilitar el control de acceso

### Validación

- **DTOs**: Data Transfer Objects con validación automática
- **Pipes**: Validación global con `ValidationPipe`
- **Sanitización**: Limpieza de datos de entrada

## 🌐 APIs y Servicios

### Endpoints Principales

- `/auth/*` - Autenticación y registro
- `/users/*` - Gestión de usuarios
- `/items/*` - Entidades musicales
- `/reviews/*` - Reseñas y calificaciones
- `/lists/*` - Listas de reproducción
- `/favorites/*` - Favoritos
- `/articles/*` - Artículos y noticias
- `/comments/*` - Comentarios
- `/notifications/*` - Notificaciones

### Configuración CORS

- Habilitado para todos los orígenes
- Soporte para credenciales
- Configurado para desarrollo y producción

## 📁 Patrones de Diseño

### Arquitectura Modular

- Cada funcionalidad está encapsulada en su propio módulo
- Separación clara de responsabilidades
- Reutilización de código mediante servicios compartidos

### Dependency Injection

- Inyección de dependencias nativa de NestJS
- Servicios singleton para optimización
- Fácil testing mediante mocking

### DTO Pattern

- Data Transfer Objects para validación de entrada
- Transformación automática de datos
- Documentación implícita de la API

## 📈 Características Destacadas

- **Escalabilidad**: Arquitectura modular preparada para crecimiento
- **Mantenibilidad**: Código bien estructurado y documentado
- **Rendimiento**: Optimizaciones de consultas y caché
- **Flexibilidad**: APIs bien diseñadas y extensibles
- **Observabilidad**: Logging y manejo de errores robusto

## 🔄 Flujo de Datos Típico

1. **Cliente** realiza petición HTTP
2. **Guards** validan autenticación/autorización
3. **Controllers** reciben y validan datos (DTOs)
4. **Services** implementan lógica de negocio
5. **Prisma** gestiona acceso a base de datos
6. **APIs externas** proporcionan datos adicionales
7. **Response** formateada y enviada al cliente

Esta arquitectura proporciona una base sólida, escalable y mantenible para el desarrollo de la plataforma APOLO.
