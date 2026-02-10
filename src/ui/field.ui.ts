import type { Field } from "../models/field.interface";

export const generateField = (field: Field): HTMLElement => {
    const fieldElement = document.createElement('div');

    fieldElement.classList.add('snake-field');

    for (const row of rowsGenerator(field.height, field.width)) {
        fieldElement.append(row);
    }

    return fieldElement;
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
