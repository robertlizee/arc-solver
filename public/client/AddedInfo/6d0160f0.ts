solution(find_master_grid(image_window(basic_grid), Color.grey), image => {
    const pattern = select(image.list, obj => obj.image.to_grid().colors().has(Color.yellow));
    image.list.forEach((obj, i) => {
        if (pattern.image.image.list[i] === Color.yellow) {
            obj.image.image.insert_before(_image => pattern.image);
        } else {
            obj.image.image.insert_before(_image => new SolidColor(Color.black));
        }
    });
    return image.apply_updates();
});