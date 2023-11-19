solution2(find_master_grid(image_window(monochrome(basic_grid)), Color.black), 
    find_master_grid(image_window(monochrome(basic_grid))),
    image => {
    image.update(image => image.grid_color = Color.red);
    const result = image.apply_updates();
    console.log(result);
    return result;
})