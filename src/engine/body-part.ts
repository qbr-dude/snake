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
    eat: () => Tail | null;
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
        eat: function () {
            // TODO: to check out why only at the end: 
            // В модели Angular signals топология графа зависимостей неизменяема после построения.
            // Следовательно, динамическое переподключение producer’ов невозможно by design.

            // instant appearance (after eat just right at the end of snake)
            let bodyPart = (this as Head).next;
            while (bodyPart?.next) {
                bodyPart = bodyPart.next;
            }

            if (!bodyPart) {
                return null
            }

            return createTail(bodyPart);
        },
    } satisfies Head;

    return head;
}

export interface Tail extends BodyPart { };

/**
 * 
 * @param parent 
 * @param positionFix - функция корректировки позиции, если родительская за пределами
 * @returns 
 */
export const createTail = (parent: Head | Tail, positionAdjust?: (parent: Head | Tail) => FieldUnitPosition | null): Tail => {
    const x = createLinkedSignal<FieldUnitPosition['x'] | null, FieldUnitPosition['x']>(
        () => parent.previousX(),
        // TODO нужно пофиксить логику positionAdjust + parent last poisition (getPreviousXLink )
        (previousX) => {
            if (previousX !== null) {
                return previousX;
            }
            const adjustedPosition = positionAdjust?.(parent) ?? null;
            // На всякий случай
            const fallback = untracked(() => parent.x()) - (isXDirection(parent.direction()) ? DEFAULT_STEP : 0);
            return adjustedPosition?.x ?? fallback;
        }
    );

    const y = createLinkedSignal<FieldUnitPosition['y'] | null, FieldUnitPosition['y']>(
        () => parent.previousY(),
        (previousY) => {
            if (previousY !== null) {
                return previousY;
            }
            const adjustedPosition = positionAdjust?.(parent) ?? null;
            // На всякий случай
            const fallback = untracked(() => parent.y() - (isYDirection(parent.direction()) ? DEFAULT_STEP : 0));
            return adjustedPosition?.y ?? fallback;
        }
    );

    // back ref logic (compare to head previous change)
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
const getPreviousXLink = ({ x, direction }: LinkedPreviousSource<PreviousXSource>): LinkedSignalGetter<PreviousXSource, FieldUnitPosition['x'] | null> => {
    /** позволяет избежать инитного значения */
    let firstRun = true;
    // TODO не коррекнтнео. ПЕРЕДЕЛВАТЬ!!!
    return createLinkedSignal<PreviousXSource, FieldUnitPosition['x'] | null>(
        () => ({ x: x(), direction: direction() }),
        (source, previous) => {
            const last = previous?.source?.x;
            if (last) {
                return last;
            }

            if (firstRun) {
                firstRun = false;
                return null;
            }

            return source.x;
        }
    );
}

/**
 * Links for previousY of body parts, based on the position and direction of the parent part. 
 * If the source value is not available (e.g. during the first computation), 
 * it falls back to calculating the previous position based on the current position and direction of movement.
 */
const getPreviousYLink = ({ y, direction }: LinkedPreviousSource<PreviousYSource>): LinkedSignalGetter<PreviousYSource, FieldUnitPosition['y'] | null> => {
    /** позволяет избежать инитного значения */
    let firstRun = true;
    return createLinkedSignal<PreviousYSource, FieldUnitPosition['y'] | null>(
        () => ({ y: y(), direction: direction() }),
        (source, previous) => {
            const last = previous?.source?.y;
            if (last) {
                return last;
            }

            if (firstRun) {
                firstRun = false;
                return null;
            }

            return source.y;
        }
    );
}

