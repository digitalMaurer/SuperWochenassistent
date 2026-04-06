# AGENTS.md

## Propósito del proyecto

Este proyecto es una aplicación de productividad personal centrada en tres pilares:

1. **Gestión de tareas**
2. **Planificación semanal y mensual con fechas reales**
3. **Impresión útil del calendario y entrada de tareas asistida por IA mediante JSON pegable**

La prioridad actual es construir una **V1 funcional y cómoda de usar**, no una plataforma completa ni una arquitectura sobredimensionada.

---

## Objetivos de la V1

### Núcleo prioritario

* Gestión cómoda de tareas actuales
* Subtareas
* Orden manual de tareas
* Tarea destacada / modo foco
* Tiempo estimado y tiempo restante
* Vista semanal real basada en fechas
* Vista mensual real conectada con la semana
* Impresión útil del calendario
* Importación manual de tareas mediante JSON generado por IA

### Qué sí debe poder hacer la V1

* Crear, editar, completar y eliminar tareas
* Reordenar tareas pendientes
* Destacar una tarea y verla en modo foco
* Añadir subtareas
* Gestionar tiempos estimados/restantes
* Planificar tareas reales en la semana
* Ver carga de trabajo en el mes
* Imprimir semana y, más adelante, mes
* Copiar un prompt para IA y pegar un JSON válido de vuelta en la app

### Qué NO entra en la V1 salvo instrucción explícita

* Backend
* Base de datos SQL o NoSQL
* Google Calendar
* Alexa
* Multicuenta
* Sincronización entre dispositivos
* Colaboración en tiempo real
* Arquitecturas enterprise
* Librerías innecesarias

---

## Stack actual y decisiones técnicas

* **Frontend:** React + Vite
* **Routing:** React Router
* **Persistencia:** localStorage
* **Estilo:** CSS propio del proyecto, sin frameworks CSS pesados salvo instrucción explícita
* **Estado:** preferencia por estado local y utilidades claras antes que introducir Redux/Zustand/etc.

### Regla general

Mantener el proyecto **simple, legible y extensible**.

No introducir nuevas dependencias sin una razón clara.

---

## Prioridades de desarrollo

### Prioridad 1 — Tareas

El módulo de tareas debe ser sólido y usable. Debe incluir:

* pendientes / completadas
* vista gestión / foco
* orden manual
* destacar
* subtareas
* tiempos
* importación JSON
* prompt IA

### Prioridad 2 — Calendario real

El calendario no debe ser abstracto. Debe trabajar con **fechas reales**.

* semana real
* mes real
* navegación temporal clara
* impresión útil

### Prioridad 3 — Conexión tareas ↔ calendario

* planificar tareas reales desde TasksPage hacia WeekPage
* mantener referencias por `taskId`
* mejorar progresivamente la conexión entre tarea y bloques de tiempo

---

## Reglas para cualquier cambio

### 1. Cambios pequeños

Hacer cambios pequeños, seguros y verificables.

No mezclar una refactorización grande con nuevas funcionalidades si no es necesario.

### 2. No romper funcionalidades ya validadas

Antes de tocar un módulo, conservar el comportamiento actual salvo que el cambio lo requiera expresamente.

### 3. Mantener compatibilidad con localStorage

Siempre que sea razonable:

* normalizar datos antiguos
* evitar perder información previa
* migrar estructuras con cuidado

### 4. No rehacer todo por gusto

Si algo funciona y es suficientemente limpio, mejorar incrementalmente.

No proponer reescrituras completas sin motivo fuerte.

### 5. No sobrediseñar

Evitar:

* patrones innecesarios
* abstracciones prematuras
* carpetas/componentes vacíos “por si acaso”
* sistemas complejos para una V1

---

## Regla de tamaño de archivos

Objetivo:

* intentar que **la mayoría de archivos no superen ~200 líneas**

Excepción:

* se puede superar ligeramente si la cohesión lo justifica

### Cómo dividir

Separar por responsabilidad:

* página
* componente reutilizable
* helpers puros
* persistencia
* selectores
* utilidades de fecha

No fragmentar de forma absurda.

---

## Organización recomendada

### Para tareas

Separar en componentes y utilidades cuando tenga sentido:

* `TasksPage`
* `TaskCard`
* `TaskList`
* `TasksToolbar`
* `TasksFilters`
* `TasksManagementView`
* `TasksFocusView`
* `TaskForm`
* `JsonImportPanel`
* `AiPromptPanel`
* `tasksStorage`
* `tasksSelectors`
* `tasksUtils`

### Para semana

* `WeekPage`
* `WeekHeader`
* `WeekNavigator`
* `WeekGrid`
* `WeekSlot`
* `WeekTaskPicker`
* `weekScheduleStorage`
* `weekDateUtils`

### Para mes

* `MonthPage`
* `MonthHeader`
* `MonthGrid`
* `MonthCell`
* `monthDateUtils`

---

## Modelos de datos: intención

### Tarea

Una tarea principal debería poder soportar como mínimo:

* `id`
* `text`
* `done`
* `highlighted`
* `priority`
* `dueDate`
* `notes`
* `tags`
* `createdAt`
* `completedAt`
* `estimatedMinutes`
* `remainingMinutes`
* `order`
* `subs`

### Asignación semanal

Una asignación de semana debería poder soportar como mínimo:

* `id` o `assignmentId`
* `date`
* `hour`
* `slotKey`
* `taskId` opcional
* `taskText` o texto visible
* `source` (`task` / `manual` o equivalente)
* `durationMinutes`
* `completed`

No introducir campos extra sin utilidad clara.

---

## UX esperada

### Modo gestión

Debe mostrar la operativa normal:

* añadir tarea
* lista completa
* filtros
* importación JSON
* prompt IA
* edición normal

### Modo foco

Debe ser limpio y concentrado.

No debe mostrar controles de gestión que distraigan.

Debe priorizar:

* tarea destacada o primera pendiente
* subtareas
* tiempos
* acciones mínimas

### Calendario

Debe ser claro, real y fácil de imprimir.

No basarse en una semana abstracta tipo lunes-domingo sin fechas reales.

---

## Importación desde IA

La integración con IA en V1 será **manual**, no automática.

### Sí

* mostrar un prompt copiable
* aceptar JSON pegado por el usuario
* validar
* importar

### No

* conectar APIs de IA
* enviar datos automáticamente a modelos externos
* acoplar el proyecto a un proveedor concreto

---

## Impresión

La impresión es una prioridad funcional.

### Debe priorizarse

* impresión semanal clara
* impresión mensual útil
* ocultar controles innecesarios al imprimir
* mostrar rangos de fecha reales

---

## Qué hacer antes de cada cambio importante

1. Entender el módulo afectado
2. Ver si ya existe una utilidad o componente reutilizable
3. Mantener el cambio acotado
4. Comprobar si hay persistencia afectada
5. Dejar un resumen claro de:

   * archivos tocados
   * qué se cambió
   * qué queda pendiente

---

## Qué evitar expresamente

* introducir backend “porque sí”
* meter base de datos antes de tiempo
* mezclar tareas de calendario, estadísticas y pomodoro en el mismo cambio
* convertir la V1 en una plataforma enorme
* romper navegación o persistencia por refactors grandes
* mover demasiados archivos a la vez sin una razón clara

---

## Política de commits recomendada

Hacer commits por bloques cerrados y funcionales.

Ejemplos:

* `Migra base React y routing inicial`
* `Migra orden manual de tareas en React`
* `Conecta tareas con planificación semanal`
* `Añade vista mensual real`
* `Añade importación JSON desde IA`

No agrupar demasiadas cosas distintas en un solo commit.

---

## Regla final para el agente

Cuando haya dudas, priorizar siempre este orden:

1. **Usabilidad real de la V1**
2. **Claridad del código**
3. **Cambios pequeños y seguros**
4. **Compatibilidad con datos existentes**
5. **Preparación razonable para crecer, sin sobrediseñar**
