solution(image_window(basic_grid), image => {
    return new ImageWindow(0, 0, image.x1, image.y1,
        new Translation(image.x1/2, image.y1/2,
            new Concentric(
                new Translation(-1, 0, 
                    new ImageTransformation(Transform.tile,
                        new ImageWindow(0, 0, image.x1/2, image.y1/2,
                            new Translation(-image.x1/2, -image.y1/2, image))))))); 
});