solution(image_window(object_list(basic_grid)), image => {
    const content = new ImageWindow(0, 0, image.x1, image.y1, 
        new ImageTransformation(Transform.tile, 
            new ImageWindow(0, 0, 1, image.y1, image)));
    const at = image.compile().at;
    const cat = content.compile().at;
    return new ImageWindow(0, 0, image.x1, image.y1,
        new Procedural((x, y) => at(x, y) !== Color.black? cat(x, y): Color.black));
});