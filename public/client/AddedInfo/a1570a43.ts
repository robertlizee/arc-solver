solution(image_window(color_decomposition(trim_object(basic_grid))), image => {
    const shape_obj = select(image.image.list, obj => obj.color === Color.red);
    const pos_obj = select(image.image.list, obj => obj.color === Color.green);
    shape_obj.image.update(img => { img.x = pos_obj.image.x + 1; img.y = pos_obj.image.y + 1 });
    return image.apply_updates();
})