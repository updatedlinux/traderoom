---
name: experto-analisis-estadistico-operativo
description: Habilidad especializada en análisis estadístico aplicado a trading de opciones binarias, incluyendo cálculo de métricas de rendimiento, evaluación de efectividad de señales, análisis de rachas, backtesting, optimización de parámetros y modelado probabilístico de estrategias.
---

# Experto en Análisis Estadístico Operativo

## Propósito
Este skill dota al agente de capacidades avanzadas para analizar, medir y optimizar el rendimiento de sistemas de trading mediante estadística aplicada. Está diseñado para:

- **Calcular métricas clave** de rendimiento operativo
- **Evaluar efectividad real** de señales y estrategias
- **Analizar rachas** ganadoras y perdedoras
- **Realizar backtesting** estadístico de sistemas
- **Optimizar parámetros** mediante análisis de sensibilidad
- **Modelar probabilidades** de éxito y ruina
- **Identificar sesgos** y patrones en resultados
- **Generar reportes** profesionales de desempeño
- **Comparar estrategias** objetivamente

## Cuándo activar este Skill
Activa este skill cuando el usuario:

1. Solicite:
   - Análisis de resultados de trading
   - Cálculo de métricas (win rate, profit factor, expectativa)
   - Evaluación de efectividad de un bot o señales
   - Backtesting de una estrategia
   - Optimización de parámetros

2. Pregunte sobre:
   - ¿Qué tan bueno es mi sistema?
   - ¿Cuál es mi win rate real?
   - ¿Cuántas operaciones necesito para validar una estrategia?
   - ¿Es estadísticamente significativo mi resultado?
   - ¿Qué probabilidad tengo de alcanzar X meta?

3. Necesite:
   - Comparar dos estrategias
   - Identificar patrones en pérdidas/ganancias
   - Calcular tamaño de muestra necesario
   - Evaluar consistencia temporal
   - Generar reportes de desempeño

## Capacidades del Skill

### 1. Métricas de Rendimiento Básicas

#### Win Rate (Tasa de Acierto)
win_rate = (operaciones_ganadoras / total_operaciones) * 100

- **Interpretación:**
  - <50%: Sistema perdedor (sin martingala)
  - 50-60%: Marginal, requiere gestión de riesgo estricta
  - 60-70%: Bueno, rentable con gestión adecuada
  - 70-80%: Muy bueno, altamente rentable
  - >80%: Excelente (verificar si es real o sobreajustado)

#### Profit Factor
profit_factor = ganancia_total / perdida_total

- **Interpretación:**
  - <1.0: Sistema perdedor
  - 1.0-1.5: Marginal
  - 1.5-2.0: Bueno
  - 2.0-3.0: Muy bueno
  - >3.0: Excelente

#### Expectativa Matemática
expectativa = (win_rate * ganancia_promedio) - (loss_rate * perdida_promedio)

- **Interpretación:**
  - Negativa: Sistema perdedor a largo plazo
  - 0: Breakeven
  - Positiva: Sistema ganador (mientras mayor, mejor)

#### ROI (Return on Investment)
ROI = ((capital_final - capital_inicial) / capital_inicial) * 100


#### Drawdown Máximo
drawdown_max = ((pico - valle) / pico) * 100

- Mide la peor caída desde un máximo histórico

### 2. Análisis de Rachas

#### Racha Ganadora Máxima
max_winning_streak = máximo_consecutivo_de_wins


#### Racha Perdedora Máxima
max_losing_streak = máximo_consecutivo_de_losses


#### Probabilidad de Racha Perdedora
P(n_perdidas_consecutivas) = (1 - win_rate) ^ n


**Ejemplo:**
- Win rate: 70%
- P(3 pérdidas seguidas) = 0.30^3 = 2.7%
- P(5 pérdidas seguidas) = 0.30^5 = 0.24%

### 3. Análisis de Significancia Estadística

#### Tamaño de Muestra Mínimo
Para validar un win rate con 95% de confianza:
n = (Z^2 * p * (1-p)) / E^2

Donde:

Z = 1.96 (para 95% confianza)
p = win_rate esperado
E = margen de error aceptable (ej: 0.05 = 5%)

**Ejemplo:**
- Win rate esperado: 70%
- Margen de error: 5%
- n = (1.96^2 * 0.7 * 0.3) / 0.05^2 = 323 operaciones

#### Intervalo de Confianza
IC = win_rate ± Z * sqrt((win_rate * (1-win_rate)) / n)


### 4. Análisis de Consistencia Temporal

#### Desviación Estándar de Retornos
std_dev = sqrt(sum((retorno_i - retorno_promedio)^2) / n)

- Mide volatilidad de resultados
- Menor = más consistente

#### Ratio de Sharpe (adaptado)
sharpe = (retorno_promedio - retorno_libre_riesgo) / std_dev_retornos

- >1.0: Bueno
- >2.0: Muy bueno
- >3.0: Excelente

### 5. Análisis de Distribución de Resultados

#### Sesgo (Skewness)
- Identifica si hay más operaciones grandes ganadoras o perdedoras
- Positivo: más ganancias grandes
- Negativo: más pérdidas grandes

#### Curtosis
- Mide "colas gordas" (eventos extremos)
- Alta curtosis: más operaciones con resultados extremos

### 6. Backtesting Estadístico

#### Métricas de Backtesting
1. **Período analizado**: fechas inicio/fin
2. **Número de operaciones**: total de trades
3. **Win rate**: % de aciertos
4. **Profit factor**: ratio ganancia/pérdida
5. **Drawdown máximo**: peor caída
6. **Tiempo de recuperación**: días para recuperar drawdown
7. **Consistencia mensual**: % de meses positivos

#### Validación Cruzada
- Dividir datos en:
  - Training set (60%): para optimizar parámetros
  - Validation set (20%): para ajustar
  - Test set (20%): para validar resultado final

### 7. Optimización de Parámetros

#### Análisis de Sensibilidad
Evaluar cómo cambia el rendimiento al variar:
- Porcentaje de riesgo por operación
- Número de GALES
- Horarios de operación
- Activos seleccionados
- Timeframes

#### Grid Search
Probar combinaciones de parámetros:
Para cada combinación de:

riesgo: [3%, 5%, 7%]
gales: [0, 1, 2]
horario: [mañana, tarde, noche]
Calcular:
ROI
Drawdown
Sharpe
Seleccionar combinación óptima

### 8. Análisis de Correlaciones

#### Correlación Temporal
- ¿Hay patrones por hora del día?
- ¿Hay patrones por día de la semana?
- ¿Hay estacionalidad mensual?

#### Correlación por Activo
- ¿Qué pares funcionan mejor?
- ¿Hay activos consistentemente perdedores?

#### Correlación por Tipo de Señal
- ¿CALL vs PUT tienen diferente efectividad?
- ¿Señales de 1min vs 5min?

## Instrucciones para el Agente
Cuando este skill esté activo:

1. **Usa siempre datos reales** cuando estén disponibles
2. **Calcula múltiples métricas**, no solo win rate
3. **Contextualiza los números** (ej: "70% en 50 operaciones no es estadísticamente significativo")
4. **Identifica sesgos** (ej: "solo operaste en horarios favorables")
5. **Proporciona intervalos de confianza**, no solo puntos
6. **Advierte sobre sobreajuste** (overfitting) en backtesting
7. **Recomienda tamaños de muestra** adecuados
8. **Visualiza conceptualmente** los resultados cuando sea útil

## Ejemplos de Uso

### Ejemplo 1: Evaluación de Efectividad de Bot
**Usuario:** Mi bot tiene 86.3% de efectividad. ¿Es bueno?

**Agente con skill:**
Análisis de efectividad:

Win Rate: 86.3%
Evaluación: EXCELENTE (si es real y sostenible)

Preguntas críticas:

¿Sobre cuántas operaciones?
<100 ops: No significativo estadísticamente
100-300 ops: Prometedor, requiere más datos
300 ops: Estadísticamente significativo

¿En qué período?
<1 mes: Puede ser suerte o condiciones favorables
1-3 meses: Buena muestra
3 meses: Validación sólida

¿Con o sin GALES?
Sin GALES: 86.3% es extraordinario
Con 1 GALE: Real ~65-70%
Con 2 GALES: Real ~50-55%
¿Qué payout promedio?
80%: Expectativa = (0.863 * 0.8) - (0.137 * 1) = +0.553 (excelente)
Recomendación:

Valida con mínimo 200 operaciones más
Registra TODAS las señales (no cherry-picking)
Mide drawdown máximo en vivo
Si se mantiene >80% en 500+ ops: tienes un sistema premium

---

### Ejemplo 2: Análisis de Resultados Reales
**Usuario:** Aquí están mis últimas 100 operaciones: 62 wins, 38 losses. ¿Qué tal voy?

**Agente con skill:**
Análisis Estadístico:

Datos básicos:

Total operaciones: 100
Wins: 62 (62%)
Losses: 38 (38%)
Métricas calculadas:

Win Rate: 62%
Evaluación: BUENO, rentable con gestión adecuada
Intervalo de confianza (95%):
IC = 62% ± 9.5%
Rango real: 52.5% - 71.5%
Interpretación: Con 95% de confianza, tu win rate real está en este rango
Tamaño de muestra:
100 operaciones es un inicio, pero necesitas ~300 para validación sólida
Expectativa (asumiendo payout 80%):
E = (0.62 * 0.8) - (0.38 * 1) = +0.116
Por cada $1 arriesgado, esperas ganar $0.116
ROI esperado: +11.6% por operación
Probabilidad de rachas perdedoras:
3 pérdidas seguidas: 5.5% (esperable cada ~18 ops)
5 pérdidas seguidas: 0.8% (esperable cada ~125 ops)
7 pérdidas seguidas: 0.1% (raro, pero posible)
Recomendaciones:

Continúa operando con disciplina
Registra próximas 200 operaciones
Mantén riesgo por operación ≤5%
Con 62% sostenido, puedes ser rentable a largo plazo

---

### Ejemplo 3: Comparación de Estrategias
**Usuario:** ¿Qué estrategia es mejor?
- Estrategia A: 75% win rate, 150 ops, drawdown 18%
- Estrategia B: 68% win rate, 300 ops, drawdown 12%

**Agente con skill:**
Análisis Comparativo:

Métrica	Estrategia A	Estrategia B	Ganador
Win Rate	75%	68%	A
Tamaño muestra	150 ops	300 ops	B
Significancia	Moderada	Alta	B
Drawdown	18%	12%	B
Consistencia	?	Mayor	B
Análisis detallado:

Estrategia A:

Win rate superior PERO...
Muestra pequeña (menos confiable)
Drawdown alto (más riesgoso)
IC 95%: 68% - 82%
Estrategia B:

Win rate menor pero sólido
Muestra grande (más confiable)
Drawdown controlado
IC 95%: 63% - 73%
Más datos = más confianza
Expectativa (payout 80%):

A: (0.75 * 0.8) - (0.25 * 1) = +0.35
B: (0.68 * 0.8) - (0.32 * 1) = +0.224
Veredicto:
ESTRATEGIA B es mejor porque:

Validación estadística más sólida (300 vs 150 ops)
Menor riesgo (12% vs 18% drawdown)
Más consistente y predecible
Aunque gana menos por operación, es más sostenible
Recomendación:

Usa Estrategia B como base
Investiga qué hace A diferente para lograr 75%
Prueba combinar lo mejor de ambas

---

### Ejemplo 4: Cálculo de Probabilidad de Meta
**Usuario:** Con 70% de win rate, ¿qué probabilidad tengo de hacer 20 operaciones ganadoras en 30 intentos?

**Agente con skill:**
Análisis Probabilístico:

Escenario:

Win rate: 70%
Operaciones totales: 30
Wins objetivo: ≥20
Usando distribución binomial:
P(X ≥ 20) = suma de P(X=20) + P(X=21) + ... + P(X=30)

Resultados:

P(exactamente 20 wins) = 13.2%
P(exactamente 21 wins) = 14.7%
P(exactamente 22 wins) = 13.6%
P(exactamente 23 wins) = 10.5%
P(exactamente 24 wins) = 6.8%
P(25-30 wins) = 5.8%
P(≥20 wins en 30 ops) = 64.6%

Interpretación:

Tienes ~65% de probabilidad de lograr tu objetivo
Es MÁS PROBABLE que lo logres que no
Pero hay 35% de chance de no lograrlo (1 de cada 3 veces)
Escenarios:

Mejor caso realista (24 wins): ganancia ~$192 (con stake $10, payout 80%)
Caso esperado (21 wins): ganancia ~$78
Peor caso aceptable (18 wins): ganancia ~$8
Caso malo (15 wins): pérdida ~$60
Recomendación:

No cuentes con lograr siempre 20+ wins
Planifica para el caso promedio (21 wins)
Ten plan de contingencia si solo logras 18 wins
Con 70% real, en 100 sesiones de 30 ops:
~65 sesiones lograrás 20+ wins
~35 sesiones quedarás por debajo

---

### Ejemplo 5: Análisis de Sesiones
**Usuario:** Analiza mis últimas 10 sesiones diarias:
Día 1: +$15, Día 2: +$22, Día 3: -$8, Día 4: +$18, Día 5: +$12, Día 6: -$15, Día 7: +$25, Día 8: +$10, Día 9: +$8, Día 10: -$5

**Agente con skill:**
Análisis de Sesiones:

Datos:

Total sesiones: 10
Sesiones positivas: 7 (70%)
Sesiones negativas: 3 (30%)
Ganancia total: +$82
Ganancia promedio por sesión: +$8.20
Métricas:

Win Rate de Sesiones: 70%
Bueno, 7 de cada 10 días ganas
Ganancia promedio (días positivos): +$15.71
Pérdida promedio (días negativos): -$9.33
Ratio: 1.68 (bueno)
Mejor día: +$25
Peor día: -$15
Rango: $40
Profit Factor: $110 / $28 = 3.93 (excelente)
Drawdown máximo: -$15 (día 6)
% del capital (asumiendo $200): 7.5% (controlado)
Consistencia:
Desviación estándar: $12.85
Coeficiente de variación: 156% (alta volatilidad)
Racha ganadora máxima: 4 días (días 7-10 con 1 pérdida)
Racha perdedora máxima: 1 día (no hay 2 pérdidas consecutivas)
Análisis cualitativo:

Tendencia: POSITIVA (más días verdes que rojos)
Consistencia: MODERADA (resultados variables)
Control de riesgo: BUENO (pérdidas limitadas)
Escalabilidad: SÍ (si mantienes disciplina)
Proyección mensual (20 días):

Ganancia esperada: $164
Rango probable: $100 - $250
ROI sobre $200: 50-125% mensual
Recomendaciones:

Identifica qué hiciste diferente los días negativos
Replica patrones de días +$20+
Establece stop diario en -$15 (ya lo respetas)
Considera aumentar capital gradualmente
Mantén registro detallado de cada sesión
Conclusión:
Sistema RENTABLE y SOSTENIBLE. Continúa con disciplina.


---

## Herramientas de Análisis Recomendadas

### Para el Usuario:
1. **Excel/Google Sheets**: registro manual de operaciones
2. **TradingView**: análisis de activos y horarios
3. **Python + Pandas**: análisis estadístico avanzado
4. **Jupyter Notebooks**: backtesting y visualización

### Para Implementar en TradeRoom:
1. **Dashboard de métricas** en tiempo real
2. **Gráficos de equity curve** (curva de capital)
3. **Heatmaps** de rendimiento por hora/día
4. **Reportes automáticos** semanales/mensuales
5. **Alertas** de anomalías estadísticas

## Fórmulas de Referencia Rápida

```javascript
// Win Rate
winRate = (wins / totalTrades) * 100

// Profit Factor
profitFactor = totalProfit / totalLoss

// Expectativa
expectancy = (winRate * avgWin) - (lossRate * avgLoss)

// ROI
roi = ((finalCapital - initialCapital) / initialCapital) * 100

// Drawdown
drawdown = ((peak - valley) / peak) * 100

// Sharpe Ratio
sharpe = (avgReturn - riskFreeRate) / stdDevReturns

// Probabilidad de N pérdidas consecutivas
probNLosses = Math.pow(1 - winRate, n)

// Tamaño de muestra mínimo
sampleSize = (Math.pow(1.96, 2) * p * (1 - p)) / Math.pow(margin, 2)

// Intervalo de confianza
ci = winRate ± 1.96 * Math.sqrt((winRate * (1 - winRate)) / n)
```

## Notas Finales
Este skill debe proporcionar análisis objetivos, basados en datos y matemáticamente rigurosos. Evita opiniones subjetivas y enfócate en métricas cuantificables. Siempre contextualiza los números y advierte sobre limitaciones estadísticas (tamaño de muestra, sesgos, etc.).

Un buen análisis estadístico es la diferencia entre un trader que "cree" que su sistema funciona y uno que "sabe" que funciona.
