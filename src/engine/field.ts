import { untracked } from "../@angular/signals";

import type { FieldUnitPosition } from "../models/field-unit.interface";
import type { Field } from "../models/field.interface";
import { isHead, type Head, type Tail } from "./body-part";

/**
 * @param width - number of FieldUnits in x direction (not px)
 * @param height - number of FieldUnits in y direction (not px)
 * 
 * @todo add uiScale to FieldUnit and use it in rendering instead of global UI_STEP_COEFFICIENT?
 */
export const createField = (width: number, height: number): Field => {
    const bodyParts = new Set<Head | Tail>();

    const bitMap = createBitMap(width, height);

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
        if (isHead(bodyPart) && contains(bodyPart)) {
            console.warn('Head already exists in the field. Cannot append another head.');
            return;
        }

        bodyParts.add(bodyPart);

        untracked(() => bitMap.takePosition(bodyPart.x(), bodyPart.y()));
    };

    const removeBodyPart: Field['removeBodyPart'] = (bodyPart) => {
        if (bodyPart.next) {
            console.warn('Attempting to remove body part that has a following part. This may lead to inconsistencies.');
            return
        }

        bodyParts.delete(bodyPart);

        untracked(() => bitMap.releasePosition(bodyPart.x(), bodyPart.y()));
    };

    const getRandomEmptyFieldUnit: Field['getRandomEmptyFieldUnit'] = () => {
        return bitMap.getEmptyPosition();
    };

    const field: Field = {
        width,
        height,
        checkBoundaries,
        appendBodyPart,
        removeBodyPart,
        contains,
        getRandomEmptyFieldUnit
    };

    return field;
}

interface BitMap {
    takePosition: (x: FieldUnitPosition['x'], y: FieldUnitPosition['y']) => void;
    releasePosition: (x: FieldUnitPosition['x'], y: FieldUnitPosition['y']) => void;
    getEmptyPosition: () => { x: FieldUnitPosition['x'], y: FieldUnitPosition['y'] } | null;
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
            return;
        }

        rowBitmaps[y] = setBit(rowBitmaps[y], x);
        rowFreeCounts[y]--;
        totalFree--;
    };

    const release: BitMap['releasePosition'] = (x, y) => {
        if (!isBitSet(rowBitmaps[y], x)) {
            console.warn(`Position (${x}, ${y}) is not taken.`);
            return;
        }

        rowBitmaps[y] = clearBit(rowBitmaps[y], x);
        rowFreeCounts[y]++;
        totalFree++;
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

    return {
        getEmptyPosition,
        takePosition: take,
        releasePosition: release,
    };
};