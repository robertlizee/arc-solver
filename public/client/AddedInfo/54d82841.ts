solution(decompose_monochrome_list_of_objects,
    grid => {
        assert(grid.type === 'sub_grids');
        return union(
            grid, point_cloud(Color.yellow, grid.list.map(e => e.coord.add(0, 1))) 
        );
    }
)
