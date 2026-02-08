import { createSignal } from "../@angular/signals";
import type { FieldUnit, FieldUnitPosition } from "../models/field-unit.interface";

export interface Food extends FieldUnit {
    /** Move food to a new position */
    roll: (xShift?: number, yShift?: number) => void;
}

export const createFood = (position: FieldUnitPosition): Food => {
    const [x, setX] = createSignal(position.x);
    const [y, setY] = createSignal(position.y);

    const roll: Food['roll'] = (xShift, yShift) => {
        if (xShift !== undefined) {
            setX(x() + xShift);
        }
        if (yShift !== undefined) {
            setY(y() + yShift);
        }
    };

    const food: Food = { x, y, roll };

    return food;
}
