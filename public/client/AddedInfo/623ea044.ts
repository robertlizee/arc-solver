solution(image_window(monochrome(trim_object(basic_grid))), image => {
    const px = image.image.image.x;
    const py = image.image.image.y;
    return new ImageWindow(0, 0, image.x1, image.y1, 
        new Procedural((x, y) => 
            x === y + px - py || x + y === px + py + 1
                ? image.image.color: Color.black));
});