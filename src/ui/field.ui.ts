import { createSignal, type SignalGetter } from "../@angular/signals";

import type { FieldUIUnit } from "../models/field-unit.interface";
import type { Field } from "../models/field.interface";

export interface FieldUI extends Omit<FieldUIUnit, 'position'> {
    /** Сколько `px` в ячейке. @todo show this can be a Promise<number> */
    cellSize: CellSizeUI;
    appendItem: (item: FieldUIUnit) => void;
    // TODO add remove
}

export const generateField = (field: Field): FieldUI => {
    const fieldElement = document.createElement('div');

    fieldElement.classList.add('snake-field');

    for (const row of rowsGenerator(field.height, field.width)) {
        fieldElement.append(row);
    }

    const appendItem: FieldUI['appendItem'] = (item) => {
        fieldElement.append(item.element);
    }

    return {
        element: fieldElement,
        cellSize: getCellSize(field, fieldElement),
        appendItem,
    };
}

function* rowsGenerator(rowCount: number, cellsInRow: number): Generator<HTMLElement> {
    let count = 0;

    while (count < rowCount) {
        const row = document.createElement('div');

        row.classList.add('snake-field-row');
        row.setAttribute('row-number', String(count));

        for (const cell of cellsGenerator(cellsInRow)) {
            cell.setAttribute('field-x', String(count));
            row.append(cell);
        }

        count += 1;

        yield row;
    }
}

function* cellsGenerator(cellCount: number): Generator<HTMLElement> {
    let count = 0;

    while (count < cellCount) {
        const cell = document.createElement('div');

        cell.classList.add('snake-field-cell');
        cell.setAttribute('field-y', String(count));

        count += 1;

        yield cell;
    }
}

interface CellSizeUI {
    width: SignalGetter<number>;
    height: SignalGetter<number>;
}

const getCellSize = (field: Field, fieldElement: HTMLElement): CellSizeUI => {
    const [cellWidth, setCellWidth] = createSignal(0);
    const [cellHeight, setCellHeight] = createSignal(0);

    const trackSize = () => {
        const { width, height } = fieldElement.getBoundingClientRect();

        setCellWidth(Math.round(width / field.width));
        setCellHeight(Math.round(height / field.height));
    }

    const resizeObs = new ResizeObserver(trackSize);
    resizeObs.observe(fieldElement);

    // init
    trackSize();

    return { width: cellWidth, height: cellHeight };
}