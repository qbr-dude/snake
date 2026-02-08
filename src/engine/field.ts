import { createWatch, isInNotificationPhase, untracked } from "../@angular/signals";

import type { FieldUnitPosition } from "../models/field-unit.interface";
import type { Field } from "../models/field.interface";
import { isHead, type Head, type Tail } from "./body-part";
import { type Food } from "./food";

type PositionKey = `${FieldUnitPosition['x']}::${FieldUnitPosition['y']}`;

/**
 * @param width - number of FieldUnits in x direction (not px)
 * @param height - number of FieldUnits in y direction (not px)
 */
export const createField = (width: number, height: number): Field => {
    const bodyParts = new Set<Head | Tail>();
    const foodUnits = new Map<PositionKey, Food>();

    let head: Head | null = null;
    let tail: Tail | null = null;

    const bitMap = createBitMap(width, height);
    const foodMap = createBitMap(width, height);

    const fieldWatcher = createWatch(
        () => {
            if (head) {
                const headPosition = { x: head.x(), y: head.y() };

                if (headEatsFood(headPosition)) {
                    head?.eat();
                    // TODO how to add new food
                }

                bitMap.takePosition(headPosition.x, headPosition.y);
            }

            if (tail) {
                const tailPosition = { x: tail.x(), y: tail.y() };

                bitMap.releasePosition(tailPosition.x, tailPosition.y);
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

    const checkBoundaries: Field['checkBoundaries'] = (bodyPart) => {
        if (!contains(bodyPart)) {
            console.warn('Body part is not present in the field. Boundary check may be inaccurate.');
            return false;
        }

        return untracked(() =>
            bodyPart.x() >= 0 &&
            bodyPart.x() < width &&
            bodyPart.y() >= 0 &&
            bodyPart.y() < height
        );
    };

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

        if (!bitMap.takePosition(bodyPart.x(), bodyPart.y())) {
            console.warn('Attempting to add body part at a position that is already occupied. This may lead to inconsistencies.');
            return;
        }
        bodyParts.add(bodyPart);
    };

    // Еда добавляется через getRandomEmptyFieldUnit, но после она все равно падает
    const dropFood: Field['dropFood'] = (food) => {
        let foodKey = `${food.x()}::${food.y()}` as PositionKey;

        if (foodUnits.get(foodKey) === food) {
            console.warn('Attempting to drop food that is already present on the field.');
            return;
        }

        if (bitMap.isPositionTaken(food.x(), food.y())) {
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
                food.roll(newPos.x - food.x(), newPos.y - food.y());
                foodKey = `${food.x()}::${food.y()}` as PositionKey;
            } else {
                console.warn('Bird took the food before it could be placed on the field.');
                return;
            }
        }

        if (foodMap.isPositionTaken(food.x(), food.y())) {
            console.log('Attempting to drop food at a position that is already occupied by another food. Releasing the old food.');
            foodMap.releasePosition(food.x(), food.y());
        }

        foodMap.takePosition(food.x(), food.y());
        bitMap.takePosition(food.x(), food.y());
        foodUnits.set(foodKey, food);
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

    const requestUpdate: Field['requestUpdate'] = () => {
        fieldWatcher.notify();
    };

    const headEatsFood = (headPosition: FieldUnitPosition) => {
        if (!head) {
            return false;
        }

        const { x, y } = headPosition;

        if (!foodMap.isPositionTaken(x, y)) {
            return false;
        }

        const foodPosition = `${x}::${y}` as PositionKey;

        foodUnits.delete(foodPosition);

        bitMap.releasePosition(x, y);
        foodMap.releasePosition(x, y);

        return true;
    };

    const field: Field = {
        width,
        height,
        checkBoundaries,
        appendBodyPart,
        removeBodyPart,
        contains,
        getRandomEmptyFieldUnit,
        requestUpdate,
        dropFood,
    };

    return field;
}

// TODO maybe make all as Promise
interface BitMap {
    takePosition: (x: FieldUnitPosition['x'], y: FieldUnitPosition['y']) => boolean;
    releasePosition: (x: FieldUnitPosition['x'], y: FieldUnitPosition['y']) => boolean;
    getEmptyPosition: () => { x: FieldUnitPosition['x'], y: FieldUnitPosition['y'] } | null;
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