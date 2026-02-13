Общая структура
A. Main Road — Snake

Это центральный документ.

Содержит:

Минимальное описание задачи

Модель состояния

Граф зависимостей

Движение

Рендеринг

Тик

Причины выбора сигналов

Без глубоких теоретических отступлений.
Только ссылки:

Подробнее про event loop → /docs/reactivity/events
Подробнее про derived state → /docs/reactivity/derived
Подробнее про rAF → /docs/rendering/frame-loop

B. Reference Section — Дополнительные документы

Разделён на независимые блоки.

1️⃣ Reactivity
Reactivity #1 — Event-driven

DOM events

ручной sync

ограничения

Reactivity #2 — Centralized State

state + render

проблема масштабирования

Reactivity #3 — Derived State

зависимые вычисления

проблема порядка пересчёта

Reactivity #4 — Async Sources

fetch

таймер

race conditions

Reactivity #5 — Graph-based Reactivity (Signals)

dependency tracking

automatic invalidation

effect vs computed

отличие от stream-based модели

Здесь ты формируешь понимание, а не защищаешь сигналы.

2️⃣ Архитектура

Отдельно:

проектирование графа зависимостей

разделение игрового состояния и представления

single source of truth

детерминизм

Важно: не “clean architecture”, а именно моделирование зависимостей.

3️⃣ Алгоритмы

Отдельный блок:

Linked list для змейки

Bitmap / Set для free space

O(1) проверка столкновения

рост без копирования массива

Это чистая алгоритмика.

4️⃣ Rendering & Performance

Отдельный блок:

Frame loop

requestAnimationFrame

fixed timestep vs variable timestep

decoupling logic tick from render tick

Paint optimization

transform vs top/left

composition layer

layout thrashing

High tick rate

Твоя мысль правильная:

при высоком тике можно уменьшать шаг

Это называется:

фиксированная скорость в клетках

но логический тик может быть чаще, чем визуальный

Можно сделать:

logicTick = 120Hz

renderTick = rAF (~60Hz)

interpolation

Это уже серьёзный уровень.

Важный момент: “сигналы — overload”

Ты правильно это чувствуешь.

Для змейки сигналы избыточны, если:

состояние простое

нет сложных derived зависимостей

Поэтому формулировка должна быть такой:

Сигналы здесь используются не из-за необходимости, а для демонстрации модели графа зависимостей.

Не “потому что это лучший способ”, а:

потому что они позволяют явно выразить реактивную модель.

Тогда читатель не будет сопротивляться.