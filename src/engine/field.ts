import { createComputed, createSignal } from "../@angular/signals";

import type { FieldUnitPosition } from "../models/field-unit.interface";
import { DEFAULT_STEP, IntersectionType, type Field } from "../models/field.interface";
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

    let [snakeHead, setSnakeHead] = createSignal<Head | null>(null);
    let [snakeTail, setSnakeTail] = createSignal<Tail | null>(null);

    // TODO как то обновлять bitmap
    const bitMap = createBitMap(width, height);
    const foodMap = createBitMap(width, height);

    const intersection = createComputed<IntersectionType | null>(() => {
        const head = snakeHead();
        const tail = snakeTail();

        if (!head || !tail) {
            return null;
        }

        const headPosition = { x: head.x(), y: head.y() };
        const tailPosition = { x: tail.x(), y: tail.y() };

        const intersectionResult = computeIntersection(headPosition);

        // Если ок по коллизии, то "сдвигаем" tail
        if (intersectionResult !== IntersectionType.HeadToBody) {
            bitMap.takePosition(headPosition.x, tailPosition.y);
            bitMap.releasePosition(tailPosition.x, tailPosition.y);
        }

        return intersectionResult;
    });

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
            setSnakeHead(bodyPart);
        }

        if (!bodyPart.next) {
            setSnakeTail(bodyPart);
        }

        // TODO нужно ли теперь обновлять позицию тут. Мб intersection обработает
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
            return;
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

    const computeIntersection = (headPosition: FieldUnitPosition): IntersectionType | null => {
        if (!bitMap.isPositionTaken(headPosition.x, headPosition.y)) {
            return null;
        }

        if (foodMap.isPositionTaken(headPosition.x, headPosition.y)) {
            return IntersectionType.HeadToFood;
        }

        return IntersectionType.HeadToBody;
    };

    const field: Field = {
        width,
        height,
        appendBodyPart,
        removeBodyPart,
        contains,
        getRandomEmptyFieldUnit,
        findGrowthCell: findGrowthCell,
        dropFood,
        intersection,
    };

    return field;
}

interface BitMap {
    takePosition: (x: FieldUnitPosition['x'], y: FieldUnitPosition['y']) => boolean;
    releasePosition: (x: FieldUnitPosition['x'], y: FieldUnitPosition['y']) => boolean;
    getEmptyPosition: () => FieldUnitPosition | null;
    isPositionTaken: (x: FieldUnitPosition['x'], y: FieldUnitPosition['y']) => boolean;
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

        // console.log(`taken: [${x}, ${y}]`);

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

        // console.log(`released: [${x}, ${y}]`);

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
    };
};