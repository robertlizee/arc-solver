solution2(find_master_grid(monochrome(basic_grid)), 
    image_window(monochrome(basic_grid)),
    image => {
        return new MonochromeColor(Color.green, 
            new SubImages(image.list.map(obj => obj.image.image), 'free'))
});