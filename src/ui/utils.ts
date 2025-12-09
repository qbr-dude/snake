export const getSnakeSize = (root: HTMLElement): number | null => {
    const snakePartSize = getComputedStyle(root).getPropertyValue('--snake-part-sizing');
    const parsed = parseInt(snakePartSize.replace('px', ''));

    return Number.isNaN(parsed) ? null : parsed;
}