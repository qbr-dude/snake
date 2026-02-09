import { createSignal, createWatch, isInNotificationPhase } from "../@angular/signals";

import type { FieldUnitPosition } from "../models/field-unit.interface";
import { DEFAULT_STEP, type Field, type HeadIntersection, type HeadToBodyIntersection, type HeadToFoodIntersection } from "../models/field.interface";
import { isHead, type Head, type Tail } from "./body-part";
import { Direction, getOppositeDirection, getSideDirections, type DirectionType } from "./direction";
import { type Food } from "./food";

/**
 * @param width - number of FieldUnits in x direction (not px)
 * @param height - number of FieldUnits in y direction (not px)
 */
export const createField = (width: number, height: number): Field => {
    const bodyParts = new Set<Head | Tail>();
    const foodUnits = new Set<Food>();

    let head: Head | null = null;
    let tail: Tail | null = null;

    const bitMap = createBitMap(width, height);
    const foodMap = createBitMap(width, height);

    const [intersection, setIntersection] = createSignal<HeadToBodyIntersection | HeadToFoodIntersection | null>(null);

    const fieldWatcher = createWatch(
        () => {
            if (head) {
                const headPosition = { x: head.x(), y: head.y() };

                const intersectionResult = headIntersectsObject(headPosition);

                setIntersection(intersectionResult);
            }

            if (tail) {
                // const tailPosition = { x: tail.previousX() ?? tail.x(), y: tail.previousY() ?? tail.y() };
                // bitMap.releasePosition(tailPosition.x, tailPosition.y);
            }
        },
        (watch) => {
            if (isInNotificationPhase() || !head || !tail) {
                return;
            }

            watch.run();
        },
        true
    );

    const contains: Field['contains'] = (bodyPart) => bodyParts.has(bodyPart);

    const checkBoundaries = (position: FieldUnitPosition): boolean => (
        position.x >= 0 &&
        position.x < width &&
        position.y >= 0 &&
        position.y < height
    );

    const appendBodyPart: Field['appendBodyPart'] = (bodyPart) => {
        if (contains(bodyPart)) {
            console.warn('Attempting to add body part that is already present in the field.');
            return;
        }

        if (isHead(bodyPart)) {
            head = bodyPart;
        }

        if (!bodyPart.next) {
            tail = bodyPart;
        }

        const [x, y] = [bodyPart.x(), bodyPart.y()];

        if (bitMap.isPositionTaken(x, y)) {
            console.warn('Attempting to add body part at a position that is already occupied. This may lead to inconsistencies.');
            return;
        }

        bodyParts.add(bodyPart);
        bitMap.takePosition(x, y);
    };

    const dropFood: Field['dropFood'] = (food) => {
        const [x, y] = [food.x(), food.y()];

        if (foodUnits.has(food)) {
            console.warn('Attempting to drop food that is already present on the field.');
            return;
        }

        if (bitMap.isPositionTaken(x, y)) {
            // Try to find a new position
            let newPos = bitMap.getEmptyPosition();
            // If not found in 5 attempts, consider a bird took the food and do not place it on the field
            let attemptsToFindNewPos = 5;

            while (
                newPos &&
                bitMap.isPositionTaken(newPos.x, newPos.y) &&
                attemptsToFindNewPos > 0
            ) {
                newPos = bitMap.getEmptyPosition();
                attemptsToFindNewPos--;
            }

            if (newPos) {
                food.roll(newPos.x - x, newPos.y - y);
            } else {
                console.warn('Bird took the food before it could be placed on the field.');
                return;
            }
        }

        if (foodMap.isPositionTaken(x, y)) {
            console.log('Attempting to drop food at a position that is already occupied by another food. Releasing the old food.');
            foodMap.releasePosition(x, y);
        }

        foodMap.takePosition(x, y);
        bitMap.takePosition(x, y);
        foodUnits.add(food);
    };

    const removeBodyPart: Field['removeBodyPart'] = (bodyPart) => {
        if (bodyPart.next) {
            console.warn('Attempting to remove body part that has a following part. This may lead to inconsistencies.');
            return
        }

        bodyParts.delete(bodyPart);
        bitMap.releasePosition(bodyPart.x(), bodyPart.y());
    };

    const getRandomEmptyFieldUnit: Field['getRandomEmptyFieldUnit'] = () => {
        return bitMap.getEmptyPosition();
    };

    /**
     * @returns позицию для роста в противоположном или боковых направлениях от `bodyPart.direction()`
     */
    const findGrowthCell: Field['findGrowthCell'] = (bodyPart) => {
        if (!contains(bodyPart)) {
            console.log('BodyPart is not a part of this field');
            return null;
        }

        const direction = bodyPart.direction();
        const [x, y] = [bodyPart.x(), bodyPart.y()];

        const positions = {
            [Direction.Up]: { x, y: y - DEFAULT_STEP },
            [Direction.Right]: { x: x + DEFAULT_STEP, y },
            [Direction.Down]: { x, y: y + DEFAULT_STEP },
            [Direction.Left]: { x: x - DEFAULT_STEP, y },
        } satisfies Record<DirectionType, FieldUnitPosition | null>;

        const candidates = [
            positions[getOppositeDirection(direction)],
            ...getSideDirections(direction).map(dir => positions[dir]),
        ] satisfies FieldUnitPosition[];

        for (const candidate of candidates) {
            if (!checkBoundaries(candidate)) {
                continue;
            }

            if (!bitMap.isPositionTaken(candidate.x, candidate.y)) {
                return candidate;
            }
        }

        return null;
    }

    const requestUpdate: Field['requestUpdate'] = () => {
        fieldWatcher.notify();
    };

    const headIntersectsObject = (headPosition: FieldUnitPosition): HeadIntersection | null => {
        if (!head || !bitMap.isPositionTaken(headPosition.x, headPosition.y)) {
            return null;
        }
        return null;

        // const positionKey = `${headPosition.x}::${headPosition.y}` as PositionKey;

        // if (foodMap.isPositionTaken(headPosition.x, headPosition.y)) {
        //     const food = foodUnits.get(positionKey);

        //     return food ? {
        //         type: IntersectionType.HeadToFood,
        //         head,
        //         food,
        //     } : null;
        // }

        // const bodyPart = bodyParts.get(positionKey);

        // return bodyPart ? {
        //     type: IntersectionType.HeadToBody,
        //     head,
        //     bodyPart,
        // } : null;
    };

    const field: Field = {
        width,
        height,
        appendBodyPart,
        removeBodyPart,
        contains,
        getRandomEmptyFieldUnit,
        findGrowthCell: findGrowthCell,
        requestUpdate,
        dropFood,
        intersection,
    };

    return field;
}

// TODO maybe make all as Promise
interface BitMap {
    takePosition: (x: FieldUnitPosition['x'], y: FieldUnitPosition['y']) => boolean;
    releasePosition: (x: FieldUnitPosition['x'], y: FieldUnitPosition['y']) => boolean;
    getEmptyPosition: () => FieldUnitPosition | null;
    isPositionTaken: (x: FieldUnitPosition['x'], y: FieldUnitPosition['y']) => boolean;
    debug: () => void;
}

const createBitMap = (width: number, height: number): BitMap => {
    // Per-row bitmaps: 0 = free, 1 = taken
    const rowBitmaps: bigint[] = Array(height).fill(0n);
    // Per-row free cell counts
    const rowFreeCounts: number[] = Array(height).fill(width);
    // Total free cells
    let totalFree = width * height;

    // Bitwise helpers
    const setBit = (bits: bigint, idx: number) => bits | (1n << BigInt(idx));
    const clearBit = (bits: bigint, idx: number) => bits & ~(1n << BigInt(idx));
    const isBitSet = (bits: bigint, idx: number) => ((bits >> BigInt(idx)) & 1n) !== 0n;

    const take: BitMap['takePosition'] = (x, y) => {
        if (isBitSet(rowBitmaps[y], x)) {
            console.warn(`Position (${x}, ${y}) is already taken.`);
            return false;
        }

        rowBitmaps[y] = setBit(rowBitmaps[y], x);
        rowFreeCounts[y]--;
        totalFree--;

        return true;
    };

    const release: BitMap['releasePosition'] = (x, y) => {
        if (!isBitSet(rowBitmaps[y], x)) {
            console.warn(`Position (${x}, ${y}) is not taken.`);
            return false;
        }

        rowBitmaps[y] = clearBit(rowBitmaps[y], x);
        rowFreeCounts[y]++;
        totalFree++;

        return true;
    };

    const getEmptyPosition: BitMap['getEmptyPosition'] = () => {
        if (totalFree === 0) {
            return null; // full
        }

        // Pick random row weighted by free count
        let randomFree = Math.floor(Math.random() * totalFree);
        let rowIdx = 0;

        for (let i = 0; i < height; i++) {
            if (randomFree < rowFreeCounts[i]) {
                rowIdx = i;
                break;
            }
            randomFree -= rowFreeCounts[i];
        }

        // Pick random free bit in this row
        let bitIdx = randomFree;
        let found = 0;

        for (let x = 0; x < width; x++) {
            if (isBitSet(rowBitmaps[rowIdx], x)) {
                continue; // taken
            }

            if (found === bitIdx) {
                return { x, y: rowIdx };
            }

            found++;
        }

        return null;
    };

    const isPositionTaken: BitMap['isPositionTaken'] = (x, y) => {
        return isBitSet(rowBitmaps[y], x);
    };

    return {
        getEmptyPosition,
        takePosition: take,
        releasePosition: release,
        isPositionTaken,
        debug: () => {
            console.log("BitMap Debug Info:");
            for (let i = 0; i < rowBitmaps.length; i++) {
                console.log(`Row ${i}: ${rowBitmaps[i].toString(2).padStart(width, '0')} (free: ${rowFreeCounts[i]})`);
            }
        }
    };
};