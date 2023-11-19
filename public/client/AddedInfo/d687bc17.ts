(grid: Grid): Grid => {
    const subgrid = grid.subgrid(1, 1, grid.width-1, grid.height-1);
    const output_subgrid = subgrid.clear_clone();
    subgrid.foreach_pixel(Color.black, (x, y, color) => {
        if (color === grid.at(0, y+1)) {
            output_subgrid.set(0, y, color);
        } else if (color === grid.at(grid.width-1, y+1)) {
            output_subgrid.set(subgrid.width-1, y, color);
        } else if (color === grid.at(x+1, 0)) {
            output_subgrid.set(x, 0, color);
        } else if (color === grid.at(x+1, grid.height-1)) {
            output_subgrid.set(x, subgrid.height-1, color);
        }
    });
    const output = grid.clone();
    output.paste(output_subgrid, { offset_x: 1, offset_y: 1 });

    return output;
}