# Сигналы на примере `Snake Game`

## Предупреждение

Код и примеры рассчитаны на разработчика, знакомого с JS/TS. Что-то еще тут.  

Что такое сигналы можно прочитать в `src/@angular/signals/README.md`. Основной упор далее будет сделан на практическом применении

## Table of contents

## Что такое реактивность

@note нужно будет вынести в другой файл, чтобы скипать (помеченный @ должны быть удалены потом)

Основное назначение браузеров - использование пользователем (хз как начать, надо что-то другое). Пользователь всячески взаимодействует с DOM деревом. Самый валидный и удобный способ обработки - через JS

### Event loop

С самого начала JS использовал событийную модель: `onclick`, `onchange` и так далее. И это единственный способ взаимодействия с браузером - подписка на событий. 

### Basic example 
 
@note: нужно максимально поделить блоки, чтобы можно было скипать инфу

Для примера возьмем `<input>` с кнопкой, введенный текст куда будет красить блок рядом:

```html
<div>this block is colorized in: <strong></strong></div>

<input type="text">

<button>Colorize</button>
```

Для подписки на изменение инпута можно использовать либо DOM биндинг, либо JS. Возьмем 2ой:

```ts
// note: Для простоты игнорируем, что `.querySelector` возвращает `<T | null>`
const div = document.querySelector('div') as HTMLDivElement;
const span = document.querySelector('span') as HTMLSpanElement;

const input = document.querySelector('input') as HTMLInputElement;

const changeHandler = (e: Event): void => {
    const text = e.target.value; // можно и `input.value`

    const color = extractColor(text);

    // note: ручное изменение `<span>` и `<div>`
    span.innerText = color; 
    div.style.backgroundColor = color;
}

input.addEventListener('change', changeHandler);

const supportedColors = new Set(['red', 'blue', 'green']);
const extractColor = (text: string): string => {
    return supportedColors.has(text) ? text : '';
}
```

note: лучше всегда выносить логику в `arrow-func`, чтобы избежать биндинга (`.bind`) и иметь возможность отписаться от события: `input.removeEventListener('change', changeHandler)`

Это базовый пример реактивности. Однако видно главное ограничение - все реакции нужно прописывать руками и они синхронные.

### Signals

@note Ниже какие-то еще примеры, просто для понимания подходов. Хотя нужно пояснение появления оберток.
Да и вообще сигналы - не то чтобы про события пользователя. А именно что реактивность. Нужно ли настолько сильно упрощать базовый пример?

### Monkey Patching, RxJS and else

@note хз, мб просто базовую инфу дать
