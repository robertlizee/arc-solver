solution2(image_window(pixel_grid), image_window(pixel_grid), 
    image => {
        const c = image.compile();
        const at = (x, y) => 2*x === image.x1? c.at(x, y) : Color.black;
        return new ImageWindow(0, 0, image.x1, image.y1, new Procedural(at));
})