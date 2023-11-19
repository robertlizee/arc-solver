solution2(image_window(monochrome_object_list(trim_object(basic_grid))),
    image_window(monochrome(trim_object(basic_grid))),
    image => {
        const shape_obj = highest(image.image.list, obj => obj.to_grid().count(c => c !== Color.black));
        const color_obj = lowest(image.image.list, obj => obj.to_grid().count(c => c !== Color.black));
        shape_obj.update(image => image.color = color_obj.color);
        return new ImageWindow(0, 0, image.x1, image.y1, shape_obj).apply_updates();
})