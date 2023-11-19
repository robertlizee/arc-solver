(grid: Grid): Grid => {
    const pattern = new Grid(5, 5, Color.teal);
    pattern.draw_perimeter(Color.blue);
    const output = grid.clone();

    for (let i = 0; i <= grid.width - pattern.width; i++) {
        for (let j = 0; j <= grid.height - pattern.height; j++) {
            if (pattern.equals(grid.subgrid(i, j, i + pattern.width, j + pattern.height))) {
                for (let x = 0; x < grid.width; x++) {
                    const y = j + 2;
                    if (grid.at(x, y) === Color.teal) {
                        output.set(x, y, Color.fuschia);
                    }
                }
                for (let y = 0; y < grid.width; y++) {
                    const x = i + 2;
                    if (grid.at(x, y) === Color.teal) {
                        output.set(x, y, Color.fuschia);
                    }
                }
            }
        }
    }

    return output;
}