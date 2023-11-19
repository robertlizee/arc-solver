(grid: Grid): Grid => {
    let x0: number = 0;
    let y0: number = 0;
    let x1: number = 0;
    let y1: number = 0;
    grid.foreach_pixel(Color.black, (x, y, color) => {
        if (color === Color.teal) {
            x0 = x;
            y0 = y;
        } else if (color === Color.red) {
            x1 = x;
            y1 = y;
        }
    });

    const output = grid.clone();

    const dy = y0 < y1? 1: y0 > y1? -1: 0;
    if (dy !== 0) {
        output.draw_line(x0, y0+dy, x0, y1, Color.yellow);
    }

    const dx = x0 < x1? 1: x0 > x1? -1: 0;
    if (dx !== 0) {
        output.draw_line(x1-dx, y1, x0, y1, Color.yellow);
    }

    return output;
}