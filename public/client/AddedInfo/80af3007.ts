solution(trim_object(image_window(object_list(basic_grid))), image => {
    const result = new SubImages(image.image.image.list.map(obj => new Translation(obj.x, obj.y, new Scale(1/3, image))), 'free');
    console.log(result);
    return result;
})