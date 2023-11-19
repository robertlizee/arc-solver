solution(object_list2(trim_object(monochrome_object_list(trim_object(basic_grid)))), image => {
    image.list.forEach(obj => {
        for (const subobj of obj.image.list) {
            if (subobj.color === Color.grey) {
                obj.update(obj => {
                    obj.x = -subobj.image.x;
                    obj.y = -subobj.image.y;
                })
            }
        }
    });

    return image.apply_updates();
})