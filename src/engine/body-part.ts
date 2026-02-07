import { createSignal, createLinkedSignal, untracked, type SignalGetter, type LinkedSignalGetter, } from "../@angular/signals";
import { DEFAULT_STEP } from "../models/field.interface";

import { type FieldUnit, type FieldUnitPosition } from "../models/field-unit.interface";
import { DEFAULT_DIRECTION, Direction, isXDirection, isYDirection, type DirectionType } from "./direction";

interface BodyPart extends FieldUnit {
    /** Куда направлено "тело" */
    direction: SignalGetter<DirectionType>;

    previousX: SignalGetter<FieldUnitPosition['x'] | null>;
    previousY: SignalGetter<FieldUnitPosition['y'] | null>;

    /** Следующая часть тела */
    next: BodyPart | null;
}
interface PreviousXSource {
    x: FieldUnitPosition['x'];
    direction: DirectionType;
}
interface PreviousYSource {
    y: FieldUnitPosition['y'];
    direction: DirectionType;
}
type LinkedPreviousSource<Source> = {
    [K in keyof Source]: SignalGetter<Source[K]>;
};
interface DirectionSource {
    direction: DirectionType;
    x: FieldUnitPosition['x'] | null;
    y: FieldUnitPosition['y'] | null;
}

export interface Head extends BodyPart {
    move: (direction: DirectionType, step?: number) => void;
    eat: () => void;
};

export const isHead = (bodyPart: BodyPart): bodyPart is Head => {
    return 'move' in bodyPart && typeof bodyPart.move === 'function';
}

export const createHead = (position: FieldUnitPosition, initialDirection: DirectionType): Head => {
    const [x, setX] = createSignal(position.x);
    const [y, setY] = createSignal(position.y);

    const [direction, setDirection] = createSignal(initialDirection ?? DEFAULT_DIRECTION);

    const previousX = getPreviousXLink({ x, direction });
    const previousY = getPreviousYLink({ y, direction });

    const move: Head['move'] = (dir, step = DEFAULT_STEP) => {
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
    };

    const head = {
        x,
        y,
        direction,
        previousX,
        previousY,
        next: null,
        move,
        eat: () => void 0,
    } satisfies Head;

    // TODO when should i create a new one? After last tail passed "eat" point? 
    head.eat = function () {
        let bodyPart = (this as Head).next;

        while (bodyPart?.next) {
            bodyPart = bodyPart.next;
        }

        if (bodyPart) {
            createTail(bodyPart);
        }
    }

    return head;
}

export interface Tail extends BodyPart { };

export const createTail = (parent: Head | Tail): Tail => {
    const x = createLinkedSignal<FieldUnitPosition['x'] | null, FieldUnitPosition['x']>(
        () => parent.previousX(),
        (source) => {
            const fallback = untracked(() => parent.x()) - (isXDirection(parent.direction()) ? DEFAULT_STEP : 0);
            return source ?? fallback;
        }
    );

    const y = createLinkedSignal<FieldUnitPosition['y'] | null, FieldUnitPosition['y']>(
        () => parent.previousY(),
        (source) => {
            const fallback = untracked(() => parent.y() - (isYDirection(parent.direction()) ? DEFAULT_STEP : 0));
            return source ?? fallback;
        }
    );

    // back ref logic (compare to head direction)
    const direction = createLinkedSignal<DirectionSource, DirectionType>(
        () => ({ direction: parent.direction(), x: x(), y: y() }),
        ({ direction }, previous) => previous?.source.direction ?? direction
    );

    const previousX = getPreviousXLink({ x, direction });
    const previousY = getPreviousYLink({ y, direction });

    const tail = { x, y, direction, next: null, previousX, previousY } as Tail;

    // link with parent
    parent.next = tail;

    return tail;
}

/**
 * Links for previousX of body parts, based on the position and direction of the parent part. 
 * If the source value is not available (e.g. during the first computation), 
 * it falls back to calculating the previous position based on the current position and direction of movement.
 */
const getPreviousXLink = ({ x, direction }: LinkedPreviousSource<PreviousXSource>): LinkedSignalGetter<PreviousXSource, FieldUnitPosition['x'] | null> =>
    createLinkedSignal<PreviousXSource, FieldUnitPosition['x'] | null>(
        () => ({ x: x(), direction: direction() }),
        (_source, previous) => previous?.source?.x ?? null
    )

/**
 * Links for previousY of body parts, based on the position and direction of the parent part. 
 * If the source value is not available (e.g. during the first computation), 
 * it falls back to calculating the previous position based on the current position and direction of movement.
 */
const getPreviousYLink = ({ y, direction }: LinkedPreviousSource<PreviousYSource>): LinkedSignalGetter<PreviousYSource, FieldUnitPosition['y'] | null> =>
    createLinkedSignal<PreviousYSource, FieldUnitPosition['y'] | null>(
        () => ({ y: y(), direction: direction() }),
        (_source, previous) => previous?.source?.y ?? null
    )
