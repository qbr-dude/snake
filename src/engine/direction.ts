import { createSignal } from "../@angular/signals";

/// DIRECTIONS

export const Direction = {
    Up: 'ArrowUp',
    Down: 'ArrowDown',
    Left: 'ArrowLeft',
    Right: 'ArrowRight'
} as const;

export const DEFAULT_DIRECTION = Direction.Right;

export type DirectionType = typeof Direction[keyof typeof Direction];

type XDirection = typeof Direction.Left | typeof Direction.Right;
type YDirection = typeof Direction.Up | typeof Direction.Down;

export const isXDirection = (direction: DirectionType): direction is XDirection =>
    direction === Direction.Left || direction === Direction.Right;

export const isYDirection = (direction: DirectionType): direction is YDirection =>
    direction === Direction.Up || direction === Direction.Down;


/// OPPOSITE DIRECTIONS

const OppositeDirection = {
    [Direction.Up]: Direction.Down,
    [Direction.Down]: Direction.Up,
    [Direction.Left]: Direction.Right,
    [Direction.Right]: Direction.Left,
} as const satisfies Readonly<Record<DirectionType, DirectionType>>;

const isOppositeDirection = (newDirection: DirectionType): boolean =>
    direction() !== newDirection && OppositeDirection[direction()] === newDirection;


/// SIGNAL

const [direction, setDirection] = createSignal<DirectionType>(DEFAULT_DIRECTION);


/// LISTENERS

const isArrowKey = (key: string): key is DirectionType =>
    Object.values(Direction).includes(key as DirectionType);

const listenToKeyboardEvent = (keyboardEvent: KeyboardEvent): void => {
    // Проверяем, что нажатая кнопка является стрелочкой
    if (!isArrowKey(keyboardEvent.key)) {
        return;
    }

    const arrow = keyboardEvent.key;

    // Не даем изменить направление, если оно противоположное
    if (isOppositeDirection(arrow)) {
        return;
    }

    setDirection(arrow);
}

/** @todo rename */
const bindDirection = () => {
    document.addEventListener('keydown', listenToKeyboardEvent);
}


export { direction, bindDirection };