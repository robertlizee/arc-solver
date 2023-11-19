solution(image_window(basic_grid), image => {
    const at = image.compile().at;
    return new ImageWindow(0, 0, image.x1, image.y1, 
        new Procedural((x, y) => at(Math.floor(x), (Math.floor(x) + Math.floor(y)) & 1)));
});