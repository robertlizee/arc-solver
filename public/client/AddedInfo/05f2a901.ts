solution2(image_window(monochrome_object_list(trim_object(image_window(basic_grid)))), 
    image_window(monochrome_object_list(trim_object(image_window(basic_grid)))),
    image => {
        const red_obj = select(image.image.list, obj => obj.color === Color.red).image;
        const teal_obj = select(image.image.list, obj => obj.color === Color.teal).image;

        red_obj.update(red_obj => {
            if (red_obj.x + red_obj.image.x1 < teal_obj.x) {
                red_obj.x = teal_obj.x - red_obj.image.x1; 
            } else if (red_obj.y + red_obj.image.y1 < teal_obj.y) {
                red_obj.y = teal_obj.y - red_obj.image.y1; 
            } else if (red_obj.x > teal_obj.x + teal_obj.image.x1) {
                red_obj.x = teal_obj.x + teal_obj.image.x1
            } else if (red_obj.y > teal_obj.y + teal_obj.image.y1) {
                red_obj.y = teal_obj.y + teal_obj.image.y1
            }

    });

    return image.apply_updates();
})