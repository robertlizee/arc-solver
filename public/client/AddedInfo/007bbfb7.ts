solution(image_window(basic_grid), image => {
    const at = image.compile().at;
    return new ImageWindow(0, 0, image.x1 * image.x1, image.y1 * image.y1,
        new Procedural((x, y) => {
            if (at(x/3, y/3) !== Color.black) {
                return at(x - 3*Math.floor(x/3), y - 3*Math.floor(y/3));    
            } else {
                return Color.black;
            }
        })) 
});