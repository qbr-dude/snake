import { createSignal } from "./signals";

/// DIRECTIONS

export const Direction = Object.freeze({
    Up: 'ArrowUp',
    Down: 'ArrowDown',
    Left: 'ArrowLeft',
    Right: 'ArrowRight'
});

export type DirectionType = typeof Direction[keyof typeof Direction];

const isArrowKey = (key: string): key is DirectionType =>
    Object.values(Direction).includes(key as DirectionType);


/// OPPOSITE DIRECTIONS

const OppositeDirection = Object.freeze({
    [Direction.Up]: Direction.Down,
    [Direction.Down]: Direction.Up,
    [Direction.Left]: Direction.Right,
    [Direction.Right]: Direction.Left,
} satisfies Readonly<Record<DirectionType, DirectionType>>);

const isOppositeDirection = (newDirection: DirectionType): boolean =>
    direction() !== newDirection && OppositeDirection[direction()] === newDirection;


/// SIGNAL

export const defaultDirection = Direction.Right;

const [direction, setDirection] = createSignal<DirectionType>(defaultDirection);

/// LISTENERS

const tryToChangeDirection = (arrow: DirectionType): void => {
    if (isOppositeDirection(arrow)) {
        return;
    }

    setDirection(arrow);
}

document.addEventListener(
    'keydown',
    e => isArrowKey(e.key) && tryToChangeDirection(e.key)
);

export { direction };