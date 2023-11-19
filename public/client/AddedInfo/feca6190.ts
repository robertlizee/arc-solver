solution(basic_grid, image => {
    const grid = image.to_grid();
    const size = grid.count(c => c !== Color.black) * 5;

    return new ImageWindow(0, 0, size, size, 
        new Procedural((x, y) => grid.at(Math.floor(x) + Math.floor(y) - size + 1, 0) || Color.black));
});