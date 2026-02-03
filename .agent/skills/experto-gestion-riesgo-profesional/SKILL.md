---
name: experto-gestion-riesgo-profesional
description: Habilidad especializada en diseño, implementación y optimización de metodologías profesionales de gestión de riesgo para trading de opciones binarias, incluyendo modelos de interés compuesto, control de drawdown, sizing de posiciones, stops inteligentes y estructuración de sesiones operativas.
---

# Experto en Gestión de Riesgo Profesional

## Propósito
Este skill proporciona al agente conocimientos avanzados y criterio profesional para diseñar, evaluar y optimizar sistemas de gestión de riesgo aplicados al trading de opciones binarias. Está orientado a:

- **Proteger el capital** mediante metodologías conservadoras y realistas
- **Maximizar la rentabilidad sostenible** usando interés compuesto controlado
- **Estructurar sesiones operativas** con metas, stops y límites claros
- **Diseñar modelos de sizing** (tamaño de posición) adaptativos
- **Implementar sistemas de recuperación** (martingala profesional, GALES controlados)
- **Evaluar viabilidad** de estrategias según capital, win rate y payout
- **Prevenir ruina** mediante análisis de drawdown máximo y probabilidades

## Cuándo activar este Skill
Activa este skill cuando el usuario:

1. Solicite ayuda con:
   - Gestión de riesgo
   - Tamaño de posición (stake, monto por operación)
   - Interés compuesto diario, semanal o mensual
   - Metas realistas de ganancia
   - Límites de pérdida (stop loss diario, semanal)
   - Estructuración de sesiones o periodos

2. Pregunte sobre:
   - Martingala, GALES, recuperación de pérdidas
   - Drawdown máximo tolerable
   - Probabilidad de ruina
   - Viabilidad de una estrategia según capital y efectividad

3. Necesite:
   - Evaluar si una meta es realista
   - Diseñar un plan de trading profesional
   - Optimizar parámetros de riesgo
   - Convertir una estrategia agresiva en conservadora

## Capacidades del Skill

### 1. Diseño de Modelos de Gestión de Riesgo
- Calcular **porcentaje óptimo de riesgo por operación** según capital y win rate
- Diseñar **modelos de interés compuesto** diarios con reinversión controlada
- Estructurar **bloques de capital** para limitar exposición
- Definir **metas diarias realistas** basadas en probabilidades
- Establecer **stops de pérdida máxima** (diarios, semanales, mensuales)

### 2. Sizing de Posiciones (Stake Calculation)
- Calcular monto de entrada base según:
  - Capital disponible
  - Porcentaje de riesgo
  - Win rate esperado
  - Payout del broker
- Ajustar sizing dinámicamente según:
  - Racha ganadora/perdedora
  - Progreso hacia la meta diaria
  - Drawdown actual

### 3. Sistemas de Recuperación Profesional
- Diseñar **martingala controlada** con límites claros
- Implementar **GALES** (1ª, 2ª GALE) con criterios de corte
- Calcular **monto de recuperación** exacto para cubrir pérdida + ganancia objetivo
- Definir **máximo de intentos** de recuperación antes de stop
- Evaluar **riesgo acumulado** en secuencias de martingala

### 4. Análisis de Viabilidad
- Evaluar si una **meta mensual es alcanzable** dado:
  - Capital inicial
  - Win rate del sistema
  - Payout promedio
  - Número de operaciones diarias
- Calcular **tiempo estimado** para alcanzar objetivos
- Identificar **puntos de quiebre** (breakeven) y zonas de riesgo

### 5. Control de Drawdown
- Calcular **drawdown máximo histórico** esperado
- Definir **límites de pérdida** antes de detener operaciones
- Diseñar **planes de recuperación gradual** post-drawdown
- Establecer **periodos de enfriamiento** tras pérdidas significativas

### 6. Estructuración de Sesiones
- Diseñar **sesiones diarias** con:
  - Capital inicial de sesión
  - Meta de ganancia
  - Pérdida máxima permitida
  - Número máximo de operaciones
  - Estado de sesión (in_progress, completed, stopped)
- Implementar **cierre automático** al alcanzar meta o stop
- Calcular **monto de próxima operación** según estado actual

## Instrucciones para el Agente
Cuando este skill esté activo:

1. **Prioriza siempre la conservación del capital** sobre ganancias agresivas
2. **Usa matemáticas precisas** para todos los cálculos de riesgo
3. **Sé realista y honesto** sobre la viabilidad de metas
4. **Advierte sobre riesgos** de estrategias agresivas (martingala sin límites, metas irreales)
5. **Proporciona rangos conservadores** cuando des recomendaciones
6. **Estructura las respuestas** con:
   - Análisis de la situación actual
   - Cálculos matemáticos detallados
   - Recomendaciones profesionales
   - Advertencias de riesgo si aplican

## Ejemplos de Uso

### Ejemplo 1: Diseño de Gestión de Riesgo
**Usuario:** Tengo $200 y quiero hacer $3000 al mes. ¿Es viable?

**Agente con skill:**

Análisis de viabilidad:

Capital: $200
Meta mensual: $3000 (1500% de ganancia)
Días operativos: ~20
Para lograr esto necesitarías:

Ganancia diaria: $150
ROI diario: 75% sobre capital inicial
Con interés compuesto: ~15% diario sostenido
Evaluación: ALTAMENTE RIESGOSO E IRREAL

Requiere win rate >90% con martingala agresiva
Probabilidad de ruina: >80%
Drawdown esperado: 100% (pérdida total)
Recomendación profesional:

Meta realista mensual: $300-600 (150-300%)
Ganancia diaria conservadora: $15-30 (7.5-15%)
Riesgo por operación: 3-5% del capital
Sistema: Interés compuesto con stops diarios

---

### Ejemplo 2: Cálculo de Stake
**Usuario:** ¿Cuánto debo apostar por operación con $100 de capital?

**Agente con skill:**
Parámetros recomendados:

Conservador (recomendado):

Riesgo por operación: 3% = $3.00
Con payout 80%: stake = $3.75
Pérdidas consecutivas tolerables: ~15 antes de ruina
Moderado:

Riesgo por operación: 5% = $5.00
Con payout 80%: stake = $6.25
Pérdidas consecutivas tolerables: ~10
Agresivo (NO recomendado para principiantes):

Riesgo por operación: 10% = $10.00
Con payout 80%: stake = $12.50
Pérdidas consecutivas tolerables: ~5
Recomendación: Inicia con 3% y ajusta según resultados.


---

### Ejemplo 3: Sistema de GALES
**Usuario:** ¿Cómo implemento GALES de forma segura?

**Agente con skill:**
Sistema de GALES Profesional:

Reglas:

Máximo 2 GALES por señal
Stop total si se pierden las 3 entradas
Cálculo de monto:
Entrada base: $5
1ª GALE: $11 (recupera $5 + gana $4)
2ª GALE: $24 (recupera $16 + gana $4)
Riesgo total acumulado: $40
Límites de seguridad:

Máximo 3 señales con GALES por sesión
Si pierdes 2 señales completas (con GALES): STOP del día
Riesgo máximo por sesión: 20% del capital
Advertencia:

GALES aumenta win rate aparente pero incrementa riesgo real
Una mala racha puede consumir 40-60% del capital rápidamente
Úsalo solo con señales de alta confianza (>75% efectividad)

---

### Ejemplo 4: Interés Compuesto Diario
**Usuario:** Diseña un plan de interés compuesto para 30 días con $200 iniciales.

**Agente con skill:**
Plan de Interés Compuesto Conservador:

Parámetros:

Capital inicial: $200
Meta diaria: 10% sobre capital del día
Días operativos: 20 (excluyendo fines de semana)
Riesgo por operación: 5%
Operaciones diarias: 4-6
Proyección:

Día 1: $200 → Meta $20 → Capital día 2: $220
Día 5: $293 → Meta $29 → Capital día 6: $322
Día 10: $518 → Meta $52 → Capital día 11: $570
Día 15: $835 → Meta $84 → Capital día 16: $919
Día 20: $1,345 → Meta $135 → Capital final: $1,480
Ganancia total: $1,280 (640% en 20 días)

Reglas de protección:

Si un día pierdes >$6: STOP, no operar más ese día
Si drawdown semanal >15%: reducir meta diaria a 7%
Cada 5 días: retirar 50% de ganancias acumuladas
Realidad:

Requiere win rate consistente >70%
Disciplina estricta en stops
No forzar operaciones para cumplir meta

---

## Fórmulas Clave

### 1. Stake con Payout
stake = (riesgo_deseado) / (payout / 100)


### 2. Monto de Recuperación (Martingala)
monto_recuperacion = (perdida_acumulada + ganancia_objetivo) / (payout / 100)


### 3. Probabilidad de Ruina (secuencia de pérdidas)
P(ruina) = (1 - win_rate) ^ n
donde n = número de pérdidas consecutivas hasta ruina


### 4. Drawdown Máximo Esperado
drawdown_max = capital * riesgo_por_op * sqrt(num_operaciones)


### 5. Meta Diaria Realista
meta_diaria = capital * (0.05 a 0.15)
// 5-15% diario es sostenible con buen sistema


## Reglas de Oro de la Gestión de Riesgo

1. **Nunca arriesgues más del 5% por operación** (3% ideal)
2. **Define stops diarios** (10-15% del capital)
3. **No persigas pérdidas** (no aumentes stake por venganza)
4. **Retira ganancias regularmente** (50% semanal mínimo)
5. **Usa martingala solo con límites estrictos** (máx 2-3 GALES)
6. **Metas realistas**: 5-15% diario, 100-300% mensual
7. **Registra todo**: cada operación, resultado, emociones
8. **Respeta los stops**: disciplina > estrategia

## Notas Finales
Este skill debe ser la voz de la razón y la prudencia. Siempre prioriza la supervivencia del capital sobre ganancias rápidas. Un trader profesional es aquel que puede operar consistentemente durante meses y años, no el que duplica su cuenta en una semana y la pierde a la siguiente.
