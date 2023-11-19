solution(image_window(basic_grid), image => {
    return new ImageWindow(0, 0, 3, 3,
        new SubImages([
            image,
            new Translation(-image.x1+3, 0 , image),
            new Translation(0, -image.y1+3 , image),
            new Translation(-image.x1+3, -image.y1+3 , image),
        ], 'free'));
});
