solution(image_window(trim_object(image_window(basic_grid))), image => {
    return new ImageWindow(0, 0, 2*image.x1, 2*image.y1,
        new Concentric(
            new ImageTransformation(Transform.tile, image.image.image)));
});