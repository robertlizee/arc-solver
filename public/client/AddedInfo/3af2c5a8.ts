solution2(image_window(basic_grid), 
    master_grid(2, 2, basic_grid),
    image => {
        return new ImageWindow(0, 0, 2*image.x1, 2*image.y1, new ImageTransformation(Transform.ping_pong, image.image));
});