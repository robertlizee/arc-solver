solution(add_info(basic_grid, complement(object_list(trim_object(basic_grid)))), image => {
    return new SubImages([image.image, ...image.info.list
        .filter(obj => obj.image.to_grid().is_solid_color())
        .map(obj => new MonochromeColor(Color.yellow, obj))
    ], 'free');
})