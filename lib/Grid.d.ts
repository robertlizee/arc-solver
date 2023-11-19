import { Color } from "./Color";
import { Transform } from "./Transform";
export declare class MetaGrid<X> {
    width: number;
    height: number;
    grid: (X | undefined)[][];
    constructor(width: number, height: number, x?: X);
    meta_clone(): MetaGrid<X>;
    meta_clear_clone(x?: X): MetaGrid<X>;
    meta_subgrid(x0: number, y0: number, x1: number, y1: number): MetaGrid<X>;
    set(x: number, y: number, xx: X): void;
    at(x: number, y: number): X | undefined;
    equals(grid: MetaGrid<X>): boolean;
    meta_map<Y>(func: (x: X) => Y): MetaGrid<Y>;
    recombine(func: (x: X) => Grid): Grid;
    foreach(output: (x: X | undefined) => void): void;
    count(test: (x: X | undefined) => boolean): number;
    count_perimeter(test: (x: X | undefined) => boolean): number;
}
export declare class Grid extends MetaGrid<Color> {
    width: number;
    height: number;
    constructor(width: number, height: number, color?: Color);
    static cast(metagrid: MetaGrid<Color>): Grid;
    static from_grid(grid: number[][]): Grid;
    to_grid(): number[][];
    clone(): Grid;
    clear_clone(color?: Color): Grid;
    subgrid(x0: number, y0: number, x1: number, y1: number): Grid;
    colors(background_color?: Color): Set<Color>;
    symmetrical(transform: Transform): boolean;
    count_holes(): void;
    draw_perimeter(color: Color): void;
    map_colors(mapping: (color: Color) => Color): Grid;
    draw_infinite_line(x: number, y: number, dx: number, dy: number, color: Color): void;
    draw_line(x0: number, y0: number, x1: number, y1: number, color: Color): void;
    draw_box(x0: number, y0: number, x1: number, y1: number, color: Color): void;
    draw_box_perimiter(x0: number, y0: number, x1: number, y1: number, color: Color): void;
    foreach_pixel(background_color: Color, action: (x: number, y: number, color: Color) => void): void;
    foreach_object(corner: boolean): Generator<Grid, void, unknown>;
    foreach_block(): Generator<Grid, void, unknown>;
    find_biggest_block(): {
        x0: number;
        y0: number;
        x1: number;
        y1: number;
    };
    erase(grid: Grid): void;
    /**
     * Find all the connected regions in the grid of the given color
     */
    findConnectedRegion(_color: Color): Grid[];
    /**
     * Find all the colors surrounding a given region Color.outside is used if the region touches the end of the grid
     */
    surrounding(_region: Grid): Set<Color>;
    /**
     * Paste the region on the grid, the black in the region mean invisible
     */
    paste(region: Grid, params?: {
        anchor_x?: number;
        anchor_y?: number;
        offset_x?: number;
        offset_y?: number;
        transform?: Transform;
        transparent_color?: Color;
        monochrome_color?: Color;
        only_if_no_color?: boolean;
    }): void;
    is_solid_color(): boolean;
    trim(background_color?: Color): {
        grid: Grid;
        x: number;
        y: number;
    };
    divide(dx: number, dy: number): MetaGrid<Grid>;
    inv_scale(s: number): Grid;
    inv_scale_width_grid(s: number): Grid;
    is_semantic_box(): boolean;
    get_semantic_box(): Grid;
    propagate(x: number, y: number, corners?: boolean): {
        obj: Grid;
        contour: Grid;
    };
    complement(): Grid;
    horizontal_colors(y: number): Set<Color>;
    vertical_colors(x: number): Set<Color>;
    find_master_grid(default_grid_color?: Color): {
        cells: {
            x: number;
            y: number;
            grid: Grid;
        }[];
        grid_color?: Color;
        stride: number;
    };
    is_scaled_by(n: number): boolean;
    is_scaled_with_grid_by(n: number): Color;
    get_scaling_factor(): number;
    get_scaling_factor_with_grid_color(): {
        scale: number;
        grid_color: Color.black | Color.blue | Color.red | Color.green | Color.yellow | Color.grey | Color.fuschia | Color.orange | Color.teal | Color.brown | Color.true_black | Color.not_written;
    };
    find_tile(): Grid;
    toString(): string;
}
