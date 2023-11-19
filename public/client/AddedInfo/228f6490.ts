solution2(add_info(image_window(color_decomposition(object_list(trim_object(basic_grid)))), complement(object_list(trim_object(basic_grid)))), 
    add_info(image_window(color_decomposition(object_list(trim_object(basic_grid)))), complement(object_list(trim_object(basic_grid)))),    image => {
        image.image.image.list.forEach(image2 => {
            if (image2.image.list.length === 1) {
                const obj = image2.image.list[0];
                const obj_grid = obj.image.to_grid();
                for (const obj2 of image.info.list) {
                    if (obj_grid.equals(obj2.image.to_grid())) {
                        obj.update(obj => {
                            obj.x = obj2.x;
                            obj.y = obj2.y;
                        })
                    }
                }

            }
        });
        return image.apply_updates();
});