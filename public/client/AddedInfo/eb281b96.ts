solution(image_window(basic_grid), image => {
    image.update(image => { image.y0 += 0.499999; image.y1 -= 0.499999; });
    return new ImageWindow(0, 0, image.x1, image.y1 * 4 - 3, new ImageTransformation(Transform.ping_pong_y, image.apply_updates()));
})