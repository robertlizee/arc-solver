solution(image_window(background(Color.yellow, basic_grid)), image => {
    return new ImageTransformation(Transform.rotation, new Translation(-image.x1/2, -image.y1/2, image.image.image));
})