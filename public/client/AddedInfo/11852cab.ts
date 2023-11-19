solution(image_window(trim_object(image_window(basic_grid))), image => {
    return new ImageWindow(0, 0, image.x1, image.y1,
        new Translation(image.image.x + image.image.image.x1 / 2, image.image.y + image.image.image.y1 /2,
            new ImageTransformation(Transform.rotation,
                new Translation(-image.image.image.x1/2, -image.image.image.y1/2, image.image.image.image))));
})