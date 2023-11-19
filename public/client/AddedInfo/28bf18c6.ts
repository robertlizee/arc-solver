solution2(trim_object(image_window(monochrome(basic_grid))), 
    master_grid(2, 1, image_window(monochrome(basic_grid))),
    image => 
        new ImageWindow(0, 0, 2*image.image.x1, image.image.y1, new ImageTransformation(Transform.tile, image.image.image)));
