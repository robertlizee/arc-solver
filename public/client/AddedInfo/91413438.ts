solution2(image_window(monochrome(basic_grid)), image_window(monochrome(basic_grid)), 
    image => {
        const black_count = image.image.image.to_grid().count(c => c === Color.black);
        const color_count = image.image.image.to_grid().count(c => c !== Color.black);
        
        const images: SymbolicImage[] = [];

        for (let i = 0; i < color_count; i++) {
            images.push(new Translation((i % black_count) * image.x1, ((i - i % black_count)/black_count) * image.y1,
                image));
        }
        
        return new ImageWindow(0, 0, image.x1 * black_count, image.y1 * black_count,
            new SubImages(images, 'free'));
});