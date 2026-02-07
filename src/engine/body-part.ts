import { createSignal, createLinkedSignal, untracked, type SignalGetter, } from "../@angular/signals";

import { DEFAULT_STEP, type Position } from "../models/position.interface";
import { DEFAULT_DIRECTION, Direction, isXDirection, isYDirection, type DirectionType } from "./direction";

interface BodyPart {
    /** Current position */
    x: SignalGetter<Position['x']>;
    /** Current position */
    y: SignalGetter<Position['y']>;
    /** Куда направлено "тело" */
    direction: SignalGetter<DirectionType>;

    previousX: SignalGetter<Position['x'] | null>;
    previousY: SignalGetter<Position['y'] | null>;

    /** Следующая часть тела */
    next: BodyPart | null;
}

export interface Head extends BodyPart {
    move: (direction: DirectionType, step?: number) => void;
    eat: () => void;
};

interface PreviousX {
    x: Position['x'] | null;
    direction: DirectionType;
}
interface PreviousY {
    y: Position['y'] | null;
    direction: DirectionType;
}

export const createHead = (position: Position, initialDirection: DirectionType): Head => {
    const [x, setX] = createSignal(position.x);
    const [y, setY] = createSignal(position.y);
    const [direction, setDirection] = createSignal(initialDirection ?? DEFAULT_DIRECTION);

    const previousX = createLinkedSignal<PreviousX, Position['x'] | null>(
        () => ({ x: x(), direction: direction() }),
        (_source, previous) => previous?.source?.x ?? null
    );
    const previousY = createLinkedSignal<PreviousY, Position['y'] | null>(
        () => ({ y: y(), direction: direction() }),
        (_source, previous) => previous?.source?.y ?? null
    );

    const head = {
        x,
        y,
        direction,
        previousX, previousY,
        next: null,
        move: (dir, step = DEFAULT_STEP) => {
            setDirection(dir);

            switch (dir) {
                case Direction.Up: {
                    return setY(y() - step);
                }
                case Direction.Right: {
                    return setX(x() + step);
                }
                case Direction.Down: {
                    return setY(y() + step);
                }
                case Direction.Left: {
                    return setX(x() - step);
                }
            }
        },
        eat: function () {
            let lastTail = this.next;

            while (lastTail?.next) {
                lastTail = lastTail.next;
            }

            if (lastTail) {
                createTail(lastTail);
            }
        }
    } satisfies Head;

    return head;
}

export interface Tail extends BodyPart { };

export const createTail = (parent: Head | Tail): Tail => {
    const x = createLinkedSignal<Position['x'] | null, Position['x']>(
        () => parent.previousX(),
        (source) => {
            const fallback = (untracked(() => parent.x()) - (untracked(() => isXDirection(parent.direction())) ? DEFAULT_STEP : 0));
            return source ?? fallback;
        }
    );

    const y = createLinkedSignal<Position['y'] | null, Position['y']>(
        () => parent.previousY(),
        (source) => {
            const fallback = untracked(() => parent.y()) - (untracked(() => isYDirection(parent.direction())) ? DEFAULT_STEP : 0);
            return source ?? fallback;
        }
    );

    interface DirectionSource {
        direction: DirectionType;
        x: Position['x'] | null;
        y: Position['y'] | null;
    }
    const direction = createLinkedSignal<DirectionSource, DirectionType>(
        () => ({ direction: parent.direction(), x: x(), y: y() }),
        ({ direction }, previous) => previous?.source.direction ?? direction
    );

    const previousX = createLinkedSignal<PreviousX, Position['x'] | null>(() => ({ x: x(), direction: direction() }), (_source, previous) => previous?.source?.x ?? null);
    const previousY = createLinkedSignal<PreviousY, Position['y'] | null>(() => ({ y: y(), direction: direction() }), (_source, previous) => previous?.source?.y ?? null);

    const tail = { x, y, direction, next: null, previousX, previousY } as Tail;

    parent.next = tail;

    return tail;
}
