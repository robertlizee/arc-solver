(grid: Grid): Grid => {
    const line = grid.subgrid(0, 2, grid.width, 3);
    const bottom = grid.subgrid(0, 3, grid.width, grid.height);
    const output = grid.clear_clone();
    output.paste(bottom, { offset_y: 3});
    output.paste(line, { offset_y: grid.height - 1, transparent_color: Color.black });
    return output;
}