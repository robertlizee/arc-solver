solution(find_master_grid(monochrome(basic_grid)), main_image => {
    const main_obj = main_image.list[0].image.image;

    for (const obj of main_image.list) {
        obj.image.insert_before(image => {
            return new SubImages([image, new MonochromeColor(main_image.grid_color, main_obj)], 'free');
        });
    }

    return main_image.apply_updates();
})