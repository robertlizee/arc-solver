solution(image_window(monochrome(trim_object(image_window(basic_grid)))), image => {
    return new ImageWindow(0, 0, image.x1, image.y1, 
        new Procedural((x, y) => {
            x = Math.floor(x);
            y = Math.floor(y);
            const color = ((x - image.image.image.x) & 1) === 0? Color.orange: Color.teal;
            const max_y = image.image.image.image.y1 - Math.abs(x - image.image.image.x);
            return y < max_y? color: Color.black;
        }));
});