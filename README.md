# 📅 PRODUCTIVIDAD - Gestor de Tareas y Planificación Semanal

Aplicación web para gestionar tareas diarias y planificar tu semana de forma visual e intuitiva.

## 🎯 Características Principales

### **Gestor de Tareas** (`tareas.html`)
- ✅ Crear, editar y eliminar tareas
- 📊 Medir productividad con estadísticas de Pomodoro
- 🎨 Interfaz oscura y fluida
- 💾 Persistencia automática con localStorage

### **Planificador Semanal** (`horario.html`)
- 📅 Vista de grid semanal (lunes a domingo)
- ⏰ Franjas horarias de 7:00 AM a 10:00 PM
- 📌 Asignar tareas a múltiples franjas simultáneamente
- 🧩 Apilar tareas en el mismo horario
- 🔄 Selección múltiple con click para marcar/desmarcar franjas
- ✏️ Modificar y eliminar asignaciones
- 🖨️ Exportar a PDF con `Ctrl+P`

## 📁 Estructura del Proyecto

```
PRODUCTIVDAD/
├── index.html              # Página de inicio
├── tareas.html             # Gestor de tareas
├── horario.html            # Planificador semanal
│
├── css/
│   ├── base.css            # Estilos globales y variables
│   ├── tareas.css          # Estilos del gestor de tareas
│   └── horario.css         # Estilos del planificador semanal
│
├── js/
│   ├── storage.js          # API centralizada de almacenamiento
│   ├── tareas.js           # Lógica del gestor de tareas
│   └── horario.js          # Lógica del planificador semanal
│
└── README.md               # Este archivo
```

## 🚀 Cómo Usar

### **Opción 1: Desde el navegador**
Abre directamente cualquier archivo HTML en tu navegador:
- `index.html` - Acceso a todos los módulos
- `tareas.html` - Solo gestor de tareas
- `horario.html` - Solo planificador semanal

### **Opción 2: Con servidor local (recomendado)**
```bash
# Python 3
python -m http.server 8000

# Node.js (http-server)
npx http-server

# PowerShell
python -m http.server 8000
```
Luego abre `http://localhost:8000`

## 💡 Flujo de Uso Típico

1. **Gestiona tus tareas** en `tareas.html`
   - Crea tareas para completar
   - Marca pendientes que planearás en la semana

2. **Planifica tu semana** en `horario.html`
   - Selecciona tareas pendientes de la lista
   - Haz click en franjas para asignarte la tarea
   - O selecciona múltiples franjas (click + click) para asignar en bloque
   - Puedes crear tareas directas en el horario sin guardarlas globalmente

3. **Visualiza y ajusta**
   - Modifica asignaciones: haz click en una tarea para eliminarla
   - Bulk actions: aplica, limpia o elimina tareas de la selección
   - Todo se guarda automáticamente

4. **Exporta a PDF** si lo necesitas
   - Abre `horario.html` 
   - Presiona `Ctrl+P` o `Cmd+P`
   - "Guardar como PDF"

## 🎨 Diseño

- **Tema**: Oscuro profesional
- **Tipografía**: Outfit (títulos) + DM Sans (cuerpo)
- **Colores**: Variedad de tonos para diferenciación visual
- **Responsivo**: Adaptado para diferentes tamaños de pantalla

## 🔄 Almacenamiento

Todos los datos se guardan automáticamente en localStorage del navegador:
- **Tareas pendientes**: Lista de items por completar
- **Estadísticas Pomodoro**: Registro de productividad  
- **Horario semanal**: Asignaciones de tareas a franjas

⚠️ **Nota**: Los datos se almacenan localmente. Limpiar el cache del navegador eliminará todo.

## 📝 Notas Técnicas

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Persistencia**: localStorage (no requiere servidor)
- **Dependencias**: Ninguna (sin librerías externas)
- **Compatibilidad**: Navegadores modernos (Chrome, Firefox, Safari, Edge)

## 🎓 Roadmap (Futuro)

- [ ] Drag-to-select para múltiples franjas
- [ ] Tareas recurrentes/plantillas
- [ ] Sincronización cross-device
- [ ] Temas personalizables
- [ ] Exportación a formatos de calendario

---

**Desarrollado con** ☕ para productividad máxima.
