---
name: creador-de-skills
description: Capacidad para crear nuevas habilidades (skills) dentro del workspace de Antigravity en idioma español, siguiendo los estándares de documentación y estructura.
---

# Creador de Skills

Este skill proporciona al agente las instrucciones necesarias para expandir sus propias capacidades mediante la creación de nuevas habilidades (skills) personalizadas para el usuario, siempre en idioma español.

## Cuándo usar este skill
- Cuando el usuario solicite una nueva "habilidad", "capacidad" o "skill".
- Cuando identifiques un conjunto de tareas repetitivas o complejas que se beneficiarían de una guía de implementación estandarizada.
- Cuando necesites estructurar conocimientos específicos del dominio del proyecto en un formato reutilizable.

## Cómo crear un nuevo skill
Para crear un skill, debes seguir estos pasos obligatorios:

1. **Estructura de Directorio**:
   Crea una carpeta dentro de `.agent/skills/` con un nombre descriptivo en minúsculas y usando guiones (kebab-case).
   Ejemplo: `.agent/skills/mi-nueva-habilidad/`

2. **Archivo SKILL.md**:
   Dentro de la carpeta, crea un archivo llamado `SKILL.md`. Este archivo DEBE contener:
   - **Frontmatter YAML**: Entre triple guion `---`, incluyendo obligatoriamente la `description` en español.
   - **Contenido Markdown**: Una explicación detallada en español de qué hace el skill y cómo utilizarlo.

3. **Idioma**:
   Todo el contenido del skill (descripción, instrucciones, ejemplos) debe estar redactado en **Español**.

4. **Componentes Opcionales**:
   - `scripts/`: Para utilidades o scripts de automatización.
   - `examples/`: Para ejemplos de uso o patrones de código.
   - `resources/`: Para archivos de soporte, plantillas o documentación adicional.

## Ejemplo de Estructura de un SKILL.md
```markdown
---
name: nombre-del-skill
description: Breve descripción en español de la utilidad del skill.
---

# Nombre del Skill

## Propósito
Explicación de para qué sirve este skill.

## Instrucciones
Pasos detallados para el agente.
```

## Reglas Críticas
- NUNCA crees un skill sin el archivo `SKILL.md`.
- Asegúrate de que la descripción en el frontmatter sea lo suficientemente clara para que el sistema sepa cuándo activarlo.
- Prioriza la claridad y la utilidad práctica del skill para el usuario.
