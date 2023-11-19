(grid: Grid): Grid => {
    const output = grid.clone();

    grid.foreach_pixel(Color.black, (x0, y0, color0) => {
        grid.foreach_pixel(Color.black, (x1, y1, color1) => {
            const same = x0 === x1 && y0 === y1;
            if (!same && (x0 === x1 || y0 === y1) && color0 === color1) {
                output.draw_line(x0, y0, x1, y1, color0);
            }
        })
    })

    return output;
}