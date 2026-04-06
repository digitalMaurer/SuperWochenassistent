---
name: productividad
description: "Custom agent for the PRODUCTIVDAD productivity app repository. Use when working on task management, calendar views, printing, JSON import, localStorage persistence, UI styling, and React/Vite front-end improvements."
applyTo:
  - "react-app/**"
  - "css/**"
  - "js/**"
  - "*.html"
  - "README.md"
---

This custom agent is specialized for the PRODUCTIVDAD app and should be selected when making changes within this repository.

Use this agent to:
- improve task management features, focus mode, and task ordering
- implement or refine weekly/monthly calendar views with real dates
- keep persistence in localStorage and avoid introducing servers or databases
- work on React/Vite UI, routes, components, and CSS styles
- preserve the current V1 priorities and keep changes small and incremental

Avoid:
- adding unnecessary dependencies
- introducing backend, sync, or multi-account functionality
- large refactors unless explicitly requested
