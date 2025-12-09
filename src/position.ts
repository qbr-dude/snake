import { createLinkedSignal } from "./signals";

import { Direction, direction, type DirectionType } from "./direction";
import { time } from "./tick";

/** Pointer position */
export interface Position {
    x: number;
    y: number;
};

/** Default step in px */
const defaultStep = 10;
let step = defaultStep;

interface PositionDependencies {
    direction: DirectionType;
    time: number;
}

const x = createLinkedSignal<PositionDependencies, Position['x']>(
    () => ({
        direction: direction(),
        time: time(),
    }),
    ({ direction }, old) => {
        const { value } = old ?? { source: direction, value: 0 };

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

const y = createLinkedSignal<PositionDependencies, Position['y']>(
    () => ({
        direction: direction(),
        time: time(),
    }),
    ({ direction }, old) => {
        const { value } = old ?? { source: direction, value: 0 };

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

const setStep = (value: number): void => { step = value };

export { x, y, setStep };

