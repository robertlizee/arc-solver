solution(image_window(monochrome(basic_grid)), image => {
    return new ImageWindow(0, 0, image.x1, image.y1,
        new Procedural((x, y) => x === y || x === image.x1 - y ? Color.black : image.image.color));
});