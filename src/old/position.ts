import { createLinkedSignal } from "../signals";

import { Direction, direction, type DirectionType } from "../engine/direction";
import { time } from "../tick";

/** Pointer position */
export interface Position {
    x: number;
    y: number;
};

const defaultPosition: Position = {
    x: 0,
    y: 0,
}

/** Default step in px */
const defaultStep = 10;
let step = defaultStep;

interface PositionDependencies {
    direction: DirectionType;
    time: number;
}

export const x = createLinkedSignal<PositionDependencies, Position['x']>(
    () => ({
        direction: direction(),
        time: time(),
    }),
    ({ direction }, old) => {
        const { value } = old ?? { source: direction, value: defaultPosition.x };

        switch (direction) {
            case Direction.Left: {
                return value - step;
            }
            case Direction.Right: {
                return value + step;
            }
            default: {
                return value;
            }
        }
    },
);

export const y = createLinkedSignal<PositionDependencies, Position['y']>(
    () => ({
        direction: direction(),
        time: time(),
    }),
    ({ direction }, old) => {
        const { value } = old ?? { source: direction, value: defaultPosition.y };

        switch (direction) {
            case Direction.Up: {
                return value - step;
            }
            case Direction.Down: {
                return value + step;
            }
            default: {
                return value;
            }
        }
    },
);

export const setStep = (value: number): void => { step = value };

export const positionsQueue = createLinkedSignal<Position, Position[]>(
    () => ({ x: x(), y: y() }),
    (newPosition, old) => {
        const { value: positions } = old ?? { source: newPosition, value: [] };

        return [newPosition, ...positions];
    }
)
