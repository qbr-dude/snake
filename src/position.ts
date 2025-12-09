import { createLinkedSignal } from "./signals";

import { Direction, direction, type DirectionType } from "./direction";
import { time } from "./tick";

interface Position {
    x: number;
    y: number;
};

/** Default step in px */
const defaultStep = 10;

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
                return value - defaultStep;
            }
            case Direction.Right: {
                return value + defaultStep;
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
                return value - defaultStep;
            }
            case Direction.Down: {
                return value + defaultStep;
            }
            default: {
                return value;
            }
        }
    },
);

export { x, y };

