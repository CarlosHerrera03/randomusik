# Randomusik — Master Plan para Claude Code

## Contexto del proyecto

Randomusik es un juego de adivinanza musical para fiestas. El jugador gira una ruleta que selecciona una categoría musical (era + dificultad), suena una canción de hasta 30 segundos, y los jugadores intentan adivinar título y artista según las reglas del modo activo.

- **Repositorio:** github.com/CarlosHerrera03s/randomusik
- **Deploy:** randomusik.vercel.app
- **Archivo de producción:** `randomusik-v2.html` (~1300 líneas, un solo archivo)
- **Audio:** Spotify Embed iFrame API — sin OAuth, sin API key, sin SDK
- **Catálogo:** `catalog.json` — 750 tracks, 5 categorías en inglés por era

---

## ⚠️ CRÍTICO — Leer antes de tocar cualquier archivo

- El archivo de producción es `randomusik-v2.html`. Trabaja EXCLUSIVAMENTE sobre este archivo.
- Usa el **Spotify Embed iFrame API**. NO el Web Playback SDK.
- `randomusik-premium.html` usa el SDK — está descartado, no lo toques ni lo uses como referencia.
- No migrar de regreso al SDK bajo ninguna circunstancia.
- No hay backend. Toda la lógica es client-side.

---

## Nueva arquitectura de archivos

Antes de implementar cualquier modo, refactorizar a esta estructura:

```
randomusik/
├── index.html              ← estructura HTML base, pantallas, navegación
├── css/
│   └── styles.css          ← todo el CSS
├── js/
│   ├── app.js              ← lógica principal, estado global, navegación
│   ├── catalog.js          ← manejo y filtrado del catálogo
│   ├── wheel.js            ← lógica de la ruleta (canvas)
│   ├── audio.js            ← control del Spotify Embed iFrame
│   └── modes/
│       ├── competitivo.js  ← Modo Competitivo
│       ├── clasico.js      ← Modo Clásico
│       ├── batalla.js      ← Batalla de DJs
│       └── telefono.js     ← Teléfono Musical
└── catalog.json            ← no modificar en esta fase
```

---

## Mecánica base — universal a todos los modos

### Flujo de una ronda (7 pasos)

1. **GIRAR** — el jugador con el turno (o el actor) gira la ruleta
2. **CATEGORÍA** — aparece era + dificultad. La canción empieza a sonar automáticamente
3. **ADIVINANZA** — los jugadores tienen 30 segundos. El host puede pausar
4. **REPETIR** — al acabar los 30s, el host puede repetir cuantas veces quiera antes de revelar
5. **REGISTRAR** — el host (o el actor) presiona el nombre del jugador que acertó, o "nadie acertó"
6. **REVELAR** — pantalla muestra canción + artista + imagen del álbum
7. **SIGUIENTE** — botón grande para continuar

### Reglas universales

- El host es árbitro absoluto — su decisión es inapelable
- El host ve lo mismo que los jugadores — sin vista especial
- Si nadie sabe la canción ni el artista, incluyendo el host: el host paga la consecuencia
- Las canciones no se repiten dentro de la misma partida

### Pantalla de fin de partida

Mostrar momentos memorables, no solo el ganador. Ejemplos:
- "Nadie supo 3 canciones seguidas de los 80s"
- "Andrea mandó 4 consecuencias seguidas"
- "Ronda más épica: todos pagaron en Mr. Brightside"

El juego registra estos eventos durante la partida para mostrarlos al final.

---

## Modo Competitivo

**Concepto:** todos pueden gritar en cualquier momento, hay un ganador claro. Sin turnos.

### Setup
- Host ingresa nombres de jugadores (mínimo 2)
- Host configura punto de victoria (default: peldaño 10)
- Toggle opcional: activar apuestas con fichas físicas

### Flujo de una ronda
1. El host gira la ruleta
2. Suena la canción — TODOS pueden gritar en cualquier momento
3. El host presiona el nombre del jugador que respondió primero
4. Se suman peldaños según lo que acertó
5. Si nadie adivina: todos los jugadores bajan un peldaño
6. Continúa hasta que alguien llega al peldaño 10

### Sistema de puntos — Escalera al Micrófono

Representación visual: escalera de 10 peldaños por jugador. Todos empiezan en 0. Primero en llegar al 10 gana.

| Situación | Resultado | Quién |
|-----------|-----------|-------|
| Aciertas canción + artista | +2 peldaños | Quien respondió |
| Aciertas solo canción O solo artista | +1 peldaño | Quien respondió |
| Respuesta incorrecta | Sin cambio | Nadie |
| Nadie adivina en toda la ronda | −1 peldaño | TODOS |
| Nadie sabe — ni el host | −1 peldaño + consecuencia | TODOS + host |

### Condición de victoria
- Gana el primer jugador en llegar al peldaño 10
- Empate: ronda de desempate — primero que responde correctamente gana

### Instrucciones para jugadores (máximo 3 puntos)
1. Todos pueden gritar cuando quieran — el primero en acertar suma peldaños
2. Canción + artista = +2 peldaños. Solo uno = +1 peldaño
3. Si nadie adivina, todos bajamos un peldaño. Primero en llegar arriba gana

---

## Modo Clásico

**Concepto:** turnos, consecuencias sociales (shots o retos), sin ganador declarado. El modo fiesta puro.

### Setup
- Host ingresa nombres de jugadores
- Toggle opcional: activar apuestas con fichas físicas
- No se configura número de rondas — termina cuando el grupo quiere

### Flujo de una ronda
1. El jugador con el turno ve la categoría que cayó en la ruleta
2. Decide a quién mandársela — elige el nombre de otro jugador en pantalla (DESPUÉS de ver la categoría)
3. Suena la canción — SOLO el jugador elegido intenta adivinar
4. El elegido responde: canción, artista, ambos, o ninguno
5. El host registra el resultado — se aplica la consecuencia
6. El turno pasa automáticamente al jugador elegido
7. Ese jugador gira la ruleta y elige a quién mandársela

### Sistema de consecuencias

| Situación | Consecuencia | Quién |
|-----------|-------------|-------|
| Adivina canción O artista (no ambos) | Manda consecuencia a quien quiera | El elegido — vale chicle |
| Adivina canción + artista | TODOS pagan consecuencia | Todos los jugadores |
| No adivina nada | El elegido paga | El jugador elegido |
| Nadie más sabe — ni el que mandó | El que mandó paga | El jugador con el turno |
| Nadie sabe — ni el host | El host paga | El host |

### Regla "no vale chicle"
- El jugador con el turno NO puede mandársela al mismo jugador que se la mandó a él
- La app lo impide automáticamente — el nombre del jugador anterior está deshabilitado

### Condición de fin
- No hay condición de victoria
- El host tiene botón "Terminar partida" disponible en cualquier momento
- Al presionarlo: pantalla de momentos memorables

### Instrucciones para jugadores (máximo 3 puntos)
1. El que tiene el turno elige a quién mandársela — después de ver la categoría
2. Si el elegido adivina uno: él manda la consecuencia a quien quiera. Si adivina los dos: todos pagan
3. Si no adivina nada: el elegido paga. El turno pasa al elegido para la siguiente ronda

---

## Batalla de DJs

**Concepto:** dos equipos compiten. El equipo en turno elige la categoría para el rival. Formato de sets.

### Setup
- Host divide jugadores en 2 equipos
- Cada equipo ingresa su nombre
- 3 sets de 5 rondas cada uno
- Cada equipo tiene 1 veto por set — no acumulable

### Flujo de una ronda
1. El equipo en turno gira la ruleta — ve qué categoría cayó
2. Puede usar su veto (si está disponible) para girar de nuevo — lo que caiga es definitivo
3. La categoría se asigna al equipo contrario
4. El equipo contrario delibera en voz alta — designa a su respondedor
5. Suena la canción — solo el respondedor designado puede responder
6. Si el respondedor falla: el equipo en turno puede robar — cualquiera del equipo grita
7. Se registra el resultado

### Sistema de puntos por ronda

| Situación | Puntos | Para quién |
|-----------|--------|-----------|
| Respondedor adivina canción + artista | +2 al set | Equipo que respondió |
| Respondedor adivina solo canción O artista | +1 al set | Equipo que respondió |
| Respondedor falla — rival roba correctamente | +2 al set | Equipo que eligió la categoría |
| Respondedor falla — rival intenta robar y falla | 0 | Nadie |
| Nadie adivina en absoluto | 0 | Nadie |

### Sistema de sets
- Cada set: 5 rondas
- Gana el set: equipo con más puntos al terminar las 5 rondas
- Empate en set: ronda extra de desempate
- Gana la partida: primer equipo en ganar 2 de 3 sets
- El veto se resetea al inicio de cada nuevo set — no se acumula

### Los vetos
- 1 veto por equipo por set
- Se usa ANTES de que la categoría se asigne al rival
- El equipo en turno veta la categoría que cayó y gira de nuevo
- El segundo giro es definitivo — no hay segundo veto en la misma ronda
- Si no se usa en el set, se pierde

### Pantalla durante el juego
- Puntos del set actual por equipo
- Marcador de sets: Equipo A [■□□] vs Equipo B [□□□]
- Ronda dentro del set: "Ronda 3 de 5"
- Indicador de veto disponible por equipo
- Indicador de quién tiene el turno de girar

### Instrucciones para jugadores (máximo 3 puntos)
1. Tu equipo elige la categoría para el rival — úsala para complicarles la vida
2. El rival decide quién responde. Si falla, tu equipo puede robar
3. Gana quien se lleve 2 de 3 sets. Tienes 1 veto por set

---

## Teléfono Musical

**Concepto:** el actor ve la canción y tiene 30s para comunicarla sin cantarla con letra. El teléfono pasa entre jugadores — no hay host árbitro.

### Setup
- Host ingresa nombres de jugadores
- Se configura quién empieza con el teléfono
- El juego funciona autónomamente — el teléfono rueda entre jugadores

### Flujo de una ronda
1. El jugador con el teléfono gira la ruleta — ve qué canción cayó. Nadie más ve la pantalla
2. Tiene 30 segundos para comunicar la canción al grupo
3. Los demás jugadores gritan cuando creen saber — todos al mismo tiempo, sin turno
4. El actor presiona el nombre del jugador que adivinó primero en pantalla
5. Si nadie adivina: el actor presiona "nadie acertó"
6. Se revela la canción en pantalla
7. El actor elige a quién pasarle el teléfono — ese jugador es el próximo actor

### Reglas del actor

**SÍ puede:**
- Tararear la melodía sin letra
- Actuar o bailar
- Hacer mímica
- Describir de qué trata la letra sin decir palabras clave

**NO puede:**
- Cantar con letra — ni una sola palabra
- Decir el título de la canción
- Decir el nombre del artista
- Decir el año o la era ("es de los 90s" no vale)
- Señalar a alguien para dar pista indirecta

### Sistema de puntos — Escalera al Micrófono

| Situación | Resultado | Quién |
|-----------|-----------|-------|
| Alguien adivina canción + artista | +2 peldaños | Quien adivinó |
| Alguien adivina solo canción O artista | +1 peldaño | Quien adivinó |
| Nadie adivina | Sin cambio — consecuencia opcional | El actor (opcional) |
| Nadie sabe — ni el actor | −1 peldaño | TODOS los jugadores |

- El actor NO puede ganar puntos en su propia ronda
- Consecuencias físicas (shots, retos) son opcionales — el grupo decide antes de empezar

### Condición de victoria
- Primero en llegar al peldaño 10 gana

### Instrucciones para jugadores (máximo 3 puntos)
1. El que tiene el teléfono ve la canción — tiene 30s para comunicarla sin cantarla con letra
2. Puede tararear, actuar o describir. No puede decir título, artista ni era
3. Quien adivina primero suma peldaños. El actor pasa el teléfono a quien quiera

---

## Capa de Apuestas — Modo Extraoficial

No es un modo independiente. Es una capa opcional encima de Modo Competitivo o Clásico.
La app NO gestiona dinero ni fichas — solo muestra instrucciones en pantalla.

### Implementación
- Toggle "🎲 Jugar con apuestas" en el setup de Modo Competitivo y Clásico
- Al activarlo: pantalla de instrucciones antes de empezar
- La app no cambia ninguna mecánica de juego

### Texto de instrucciones (Modo Clásico)
1. Cada jugador pone algo al bote antes de empezar (dinero, reto, lo que el grupo decida)
2. Cuando el jugador con el turno elige a quién mandársela, puede apostar fichas físicas sobre ese nombre
3. Si el elegido falla: el apostador gana su ficha. Si acierta: el elegido gana la ficha del apostador
4. Quien tenga más fichas al terminar se lleva el bote

---

## Plan de implementación — fases en orden

**IMPORTANTE: No pasar a la siguiente fase sin probar la anterior con personas reales.**

### FASE 0 — Refactorización (sin cambiar funcionalidad)
- [ ] Leer randomusik-v2.html completo y entender la estructura actual
- [ ] Crear estructura de carpetas: css/, js/, js/modes/
- [ ] Separar CSS a css/styles.css
- [ ] Separar ruleta a js/wheel.js
- [ ] Separar audio a js/audio.js
- [ ] Separar catálogo a js/catalog.js
- [ ] Dejar lógica actual en js/app.js
- [ ] Verificar que index.html funciona igual que antes
- [ ] Commit: "refactor: separar en módulos sin cambiar funcionalidad"

### FASE 1 — Modo Competitivo
- [ ] Pantalla de setup: ingresar jugadores
- [ ] Crear js/modes/competitivo.js
- [ ] Implementar escalera visual (SVG o Canvas)
- [ ] Registro de quien adivinó (host presiona nombre)
- [ ] Lógica de +2 / +1 / −1 peldaños
- [ ] Condición de victoria al llegar al peldaño 10
- [ ] Ronda de desempate
- [ ] Pantalla de instrucciones del modo
- [ ] Pantalla de fin con momentos memorables
- [ ] Commit: "feat: Modo Competitivo con escalera al micrófono"

### FASE 2 — Modo Clásico
- [ ] Crear js/modes/clasico.js
- [ ] Sistema de turnos con lista de jugadores
- [ ] UI para elegir a quién mandársela (jugador anterior deshabilitado)
- [ ] Los 4 resultados posibles con sus consecuencias
- [ ] Paso automático del turno al jugador elegido
- [ ] Botón "Terminar partida" en todo momento
- [ ] Pantalla de momentos memorables al terminar
- [ ] Pantalla de instrucciones del modo
- [ ] Commit: "feat: Modo Clásico con turnos y consecuencias"

### FASE 3 — Batalla de DJs
- [ ] Crear js/modes/batalla.js
- [ ] Setup: dividir jugadores en 2 equipos, nombrar equipos
- [ ] Marcador de sets: Equipo A [■□□] vs Equipo B [□□□]
- [ ] Lógica de turno de equipos y elección de categoría para el rival
- [ ] UI para que el equipo rival designe su respondedor
- [ ] Lógica de robo al fallar
- [ ] Sistema de vetos (1 por set, botón visible cuando disponible)
- [ ] Conteo de 5 rondas por set y cambio de set automático
- [ ] Condición de victoria: 2 de 3 sets
- [ ] Pantalla de instrucciones del modo
- [ ] Commit: "feat: Batalla de DJs con sets y vetos"

### FASE 4 — Teléfono Musical
- [ ] Crear js/modes/telefono.js
- [ ] Vista del actor: canción en pantalla grande + timer de 30s
- [ ] Vista del grupo: pantalla oculta mientras el actor actúa
- [ ] Registro de quien adivinó (el actor presiona el nombre)
- [ ] Escalera al micrófono igual que Modo Competitivo
- [ ] UI para pasar el teléfono: el actor elige al próximo
- [ ] Regla: el actor no puede ganar puntos en su ronda
- [ ] Pantalla de instrucciones con reglas del actor
- [ ] Commit: "feat: Teléfono Musical"

### FASE 5 — Apuestas y pulido general
- [ ] Toggle de apuestas en setup de Modo Competitivo y Clásico
- [ ] Pantalla de instrucciones de apuestas por modo
- [ ] Revisar consistencia visual entre todos los modos
- [ ] Verificar que instrucciones de cada modo son claras en máximo 3 puntos
- [ ] Probar en móvil (pantalla vertical)
- [ ] Probar en laptop proyectada a TV
- [ ] Fix de bugs de pruebas reales
- [ ] Commit: "feat: capa de apuestas y pulido final v1.0"

---

## Pendiente para fases futuras — no implementar ahora

- Enrichment del catálogo con preview_url e imagen via iTunes Search API
- Modo Traición: requiere websockets — arquitectura diferente
- Otras representaciones visuales: Volcán, Cohete, Caguama, Surfistas
- Versión PWA instalable
- Soporte para más idiomas y eras no anglófonas

---

## Principios de diseño — no negociables

1. **SIMPLICIDAD:** Si una mecánica requiere más de 3 líneas para explicarse, hay que simplificarla
2. **MOBILE FIRST:** El juego se corre desde un teléfono sostenido en la mano en una fiesta
3. **SIN BACKEND:** Toda la lógica es client-side. Sin base de datos, sin usuarios, sin sesiones
4. **SPOTIFY EMBED:** No tocar la integración de audio. Funciona. No romper lo que funciona
5. **PRUEBA REAL:** Cada fase se prueba con personas reales antes de continuar
