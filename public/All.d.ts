declare class Abstraction extends ConcreteImage {
    name: string;
    sub_images: ConcreteImage[];
    black_box: boolean;
    number_arguments: number[];
    color_arguments: Color[];
    grid_arguments: Grid[];
    build_parts?: (abstraction: Abstraction) => void;
    get_number_arguments: NumberFunction[];
    get_color_argumennts: ColorFunction[];
    get_grid_arguments: GridFunction[];
    parts: ConcreteImage[];
    parts_selector: BooleanFunction[];
    sub_images_to_classify: ConcreteImage[];
    solver_options: SolverOptions;
    constructor(name: string, sub_images: ConcreteImage[]);
    get_type(): string;
    clone(): this;
    translate(dx: number, dy: number): ConcreteImage;
    compile(): ImageCompilation;
    get_number_argument(index: number): F<number>;
    number_functions(): NumberFunction[];
    get_color_argument(index: number): F<Color>;
    color_functions(): ColorFunction[];
    get_grid_argument(index: number): F<Grid>;
    grid_functions(): GridFunction[];
    grids(): Generator<Grid, void, unknown>;
    make_flesh_abstraction(select_parts?: boolean): (abstraction: Abstraction) => boolean;
    get_arguments(): void;
    select_parts(): boolean;
    build(): void;
    build_solver_function(solver: Solver, path: PathFunction): Promise<ImageFunction<SymbolicImage, ConcreteImage>>;
    add_part(part_selector: BooleanFunction, input_abstractions: Abstraction[], output_abstractions: Abstraction[]): Promise<boolean>;
    abstract_new_part(input_abstractions: Abstraction[], output_abstractions: Abstraction[]): Promise<boolean>;
    check_potential_abstraction(abstractions: Abstraction[]): boolean;
    abstract_all_parts(abstractions: Abstraction[]): Promise<boolean>;
    images(): Generator<ConcreteImage, void, unknown>;
    static discover_abstractions(images: ConcreteImage[]): Promise<(image: ConcreteImage) => void>;
}
declare enum Color {
    black = 0,
    blue = 1,
    red = 2,
    green = 3,
    yellow = 4,
    grey = 5,
    fuschia = 6,
    orange = 7,
    teal = 8,
    brown = 9,
    true_black = 10,
    not_written = 11,
    false = 0,
    true = 1,
    no_color = -1
}
declare const identity_color_mapping: Color[];
declare class ImageCompilation {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    at: (x: number, y: number) => Color;
    constructor(x0: number, y0: number, x1: number, y1: number, at: (x: number, y: number) => Color);
    generate_grid(): Grid;
}
declare class ConcreteImage extends SymbolicImage {
    protected update_func?: (x: any) => void;
    protected insert_before_func?: (image: ConcreteImage) => ConcreteImage;
    protected do_delete: boolean;
    private builders?;
    constructor();
    set_builders(builders: {
        [key: string]: string | string[];
    }): this;
    get_type(): string;
    clone(): this;
    get key(): string;
    translate(_dx: number, _dy: number): ConcreteImage;
    compile(): ImageCompilation;
    build_solver_function(_solver: Solver, _path: PathFunction): Promise<ImageFunction<SymbolicImage, ConcreteImage>>;
    to_grid(): Grid;
    images(): Generator<ConcreteImage>;
    recur_images(): Generator<ConcreteImage>;
}
declare class BasicImage extends ConcreteImage {
    list: Color[];
    stride: number;
    grid: Grid;
    holes_count: number;
    symmetrical_x: number;
    constructor(list: Color[], stride: number);
    get key(): string;
    get_type(): string;
    clone(): this;
    translate(dx: number, dy: number): ConcreteImage;
    compile(): ImageCompilation;
    get width(): number;
    get area(): number;
    get height(): number;
    get non_black(): number;
    get nb_colors(): number;
    number_functions(): import("./Solver").NumberFunction[];
    get touching_perimeter(): 0 | 1;
    color_functions(): any[];
    grid_functions(): import("./Solver").GridFunction[];
    build_solver_function(solver: Solver, path: PathFunction): Promise<ImageFunction<SymbolicImage, ConcreteImage>>;
    grids(): Generator<Grid, void, unknown>;
}
declare class SemanticBox extends ConcreteImage {
    width: number;
    height: number;
    list: Color[];
    constructor(width: number, height: number, list: Color[]);
    get key(): string;
    get area(): number;
    get_type(): string;
    clone(): this;
    translate(dx: number, dy: number): ConcreteImage;
    compile(): ImageCompilation;
    number_functions(): import("./Solver").NumberFunction[];
    get c0(): Color;
    get c1(): Color;
    get c2(): Color;
    get c3(): Color;
    get c4(): Color;
    get c5(): Color;
    get c6(): Color;
    get c7(): Color;
    get c8(): Color;
    color_functions(): import("./Solver").ColorFunction[];
    build_solver_function(solver: Solver, path: PathFunction): Promise<ImageFunction<SymbolicImage, ConcreteImage>>;
}
declare class MonochromeColor<I extends ConcreteImage> extends ConcreteImage {
    color: Color;
    image: I;
    constructor(color: Color, image: I);
    get key(): string;
    get_type(): string;
    clone(): this;
    translate(dx: number, dy: number): ConcreteImage;
    compile(): ImageCompilation;
    number_functions(): F<number>[];
    color_functions(): import("./Solver").ColorFunction[];
    grid_functions(): F<Grid>[];
    sub_images_functions(): F<SymbolicImage[]>[];
    build_solver_function(solver: Solver, path: PathFunction): Promise<ImageFunction<SymbolicImage, ConcreteImage>>;
    grids(): Generator<Grid, void, unknown>;
    images(): Generator<I, void, unknown>;
}
declare class Alternatives extends ConcreteImage {
    alternatives: ConcreteImage[];
    constructor(alternatives: ConcreteImage[]);
    get key(): string;
    get_type(): string;
    clone(): this;
    translate(dx: number, dy: number): ConcreteImage;
    compile(): ImageCompilation;
    number_functions(): F<number>[];
    color_functions(): F<Color>[];
    grid_functions(): F<Grid>[];
    sub_images_functions(): F<SymbolicImage[]>[];
    build_solver_function(solver: Solver, path: PathFunction): Promise<ImageFunction<SymbolicImage, ConcreteImage>>;
    grids(): Generator<Grid, void, unknown>;
    images(): Generator<ConcreteImage, void, unknown>;
}
declare class ImageData<I extends ConcreteImage> extends ConcreteImage {
    data: number[];
    image: I;
    constructor(data: number[], image: I);
    get key(): string;
    get_type(): string;
    clone(): this;
    translate(dx: number, dy: number): ConcreteImage;
    compile(): ImageCompilation;
    number_functions(): F<number>[];
    color_functions(): F<Color>[];
    grid_functions(): F<Grid>[];
    sub_images_functions(): F<SymbolicImage[]>[];
    build_solver_function(solver: Solver, path: PathFunction): Promise<ImageFunction<SymbolicImage, ConcreteImage>>;
    grids(): Generator<Grid, void, unknown>;
    images(): Generator<I, void, unknown>;
}
declare class BackgroundColor<I extends ConcreteImage> extends ConcreteImage {
    background_color: Color;
    image: I;
    constructor(background_color: Color, image: I);
    get key(): string;
    get_type(): string;
    clone(): this;
    translate(dx: number, dy: number): ConcreteImage;
    compile(): ImageCompilation;
    number_functions(): F<number>[];
    color_functions(): import("./Solver").ColorFunction[];
    grid_functions(): F<Grid>[];
    sub_images_functions(): F<SymbolicImage[]>[];
    build_solver_function(solver: Solver, path: PathFunction): Promise<ImageFunction<SymbolicImage, ConcreteImage>>;
    grids(): Generator<Grid, void, unknown>;
    images(): Generator<I, void, unknown>;
}
declare class SubImages<I extends ConcreteImage> extends ConcreteImage {
    list: I[];
    stride: number | 'free' | 'xor' | 'and';
    grid_color: Color;
    fixed_size: boolean;
    constructor(list: I[], stride: number | 'free' | 'xor' | 'and', grid_color?: Color, fixed_size?: boolean);
    get key(): string;
    get_type(): string;
    clone(): this;
    translate(dx: number, dy: number): ConcreteImage;
    compile(): ImageCompilation;
    get count(): number;
    number_functions(): F<number>[];
    color_functions(): F<Color>[];
    grid_functions(): F<Grid>[];
    sub_images_functions(): F<I[]>[];
    build_solver_function(solver: Solver, path: PathFunction): Promise<ImageFunction<SymbolicImage, ConcreteImage>>;
    grids(): Generator<Grid, void, unknown>;
    images(): Generator<I, void, unknown>;
}
declare class ImageWindow<I extends ConcreteImage> extends ConcreteImage {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    image: I;
    constructor(x0: number, y0: number, x1: number, y1: number, image: I);
    get key(): string;
    get_type(): string;
    clone(): this;
    translate(dx: number, dy: number): ConcreteImage;
    compile(): ImageCompilation;
    get width(): number;
    get height(): number;
    get area(): number;
    number_functions(): import("./Solver").NumberFunction[];
    color_functions(): F<Color>[];
    grid_functions(): F<Grid>[];
    sub_images_functions(): F<SymbolicImage[]>[];
    build_solver_function(solver: Solver, path: PathFunction): Promise<ImageFunction<SymbolicImage, ConcreteImage>>;
    grids(): Generator<Grid, void, unknown>;
    images(): Generator<I, void, unknown>;
}
declare class Scale<I extends ConcreteImage> extends ConcreteImage {
    scale: number;
    image: I;
    grid_color: Color;
    constructor(scale: number, image: I, grid_color?: Color);
    get key(): string;
    get_type(): string;
    clone(): this;
    translate(dx: number, dy: number): ConcreteImage;
    compile(): ImageCompilation;
    number_functions(): import("./Solver").NumberFunction[];
    color_functions(): import("./Solver").ColorFunction[];
    grid_functions(): F<Grid>[];
    sub_images_functions(): F<SymbolicImage[]>[];
    build_solver_function(solver: Solver, path: PathFunction): Promise<ImageFunction<SymbolicImage, ConcreteImage>>;
    grids(): Generator<Grid, void, unknown>;
    images(): Generator<I, void, unknown>;
}
type AnchorType = 0 | 1 | 'center' | 'zero';
declare class Translation<I extends ConcreteImage> extends ConcreteImage {
    image: I;
    x: number;
    y: number;
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    constructor(x: number, y: number, image: I, anchor_x?: AnchorType, anchor_y?: AnchorType);
    get key(): string;
    get_type(): string;
    clone(): this;
    translate(dx: number, dy: number): ConcreteImage;
    compile(): ImageCompilation;
    get cx(): number;
    get cy(): number;
    number_functions(): import("./Solver").NumberFunction[];
    color_functions(): F<Color>[];
    grid_functions(): F<Grid>[];
    sub_images_functions(): F<SymbolicImage[]>[];
    build_solver_function(solver: Solver, path: PathFunction): Promise<ImageFunction<SymbolicImage, ConcreteImage>>;
    grids(): Generator<Grid, void, unknown>;
    images(): Generator<I, void, unknown>;
}
declare class ImageTransformation<I extends ConcreteImage> extends ConcreteImage {
    transformation: Transform;
    image: I;
    constructor(transformation: Transform, image: I);
    get key(): string;
    get_type(): string;
    clone(): this;
    translate(dx: number, dy: number): ConcreteImage;
    compile(): ImageCompilation;
    number_functions(): F<number>[];
    color_functions(): F<Color>[];
    grid_functions(): F<Grid>[];
    sub_images_functions(): F<SymbolicImage[]>[];
    build_solver_function(solver: Solver, path: PathFunction): Promise<ImageFunction<SymbolicImage, ConcreteImage>>;
    grids(): Generator<Grid, void, unknown>;
    images(): Generator<I, void, unknown>;
}
declare class BackgroundPixel extends ConcreteImage {
    get key(): string;
    get_type(): string;
    clone(): this;
    translate(dx: number, dy: number): ConcreteImage;
    compile(): ImageCompilation;
}
declare class Pixel extends ConcreteImage {
    color?: Color;
    constructor(color?: Color);
    get key(): string;
    get_type(): string;
    clone(): this;
    translate(dx: number, dy: number): ConcreteImage;
    compile(): ImageCompilation;
    color_functions(): import("./Solver").ColorFunction[];
    build_solver_function(solver: Solver, path: PathFunction): Promise<ImageFunction<SymbolicImage, ConcreteImage>>;
}
declare class SolidColor extends ConcreteImage {
    color?: Color;
    constructor(color?: Color);
    get key(): string;
    get_type(): string;
    clone(): this;
    translate(_dx: number, _dy: number): ConcreteImage;
    compile(): ImageCompilation;
    color_functions(): import("./Solver").ColorFunction[];
    build_solver_function(solver: Solver, path: PathFunction): Promise<ImageFunction<SymbolicImage, ConcreteImage>>;
}
declare class Procedural extends ConcreteImage {
    at: (x: number, y: number) => Color;
    constructor(at: (x: number, y: number) => Color);
    get key(): string;
    get_type(): string;
    clone(): this;
    translate(dx: number, dy: number): ConcreteImage;
    compile(): ImageCompilation;
}
declare class Concentric<I extends ConcreteImage> extends ConcreteImage {
    image: I;
    constructor(image: I);
    get key(): string;
    get_type(): string;
    clone(): this;
    translate(dx: number, dy: number): ConcreteImage;
    compile(): ImageCompilation;
    grids(): Generator<Grid, void, unknown>;
    images(): Generator<I, void, unknown>;
}
declare class Info<I1 extends ConcreteImage, I2 extends ConcreteImage> extends ConcreteImage {
    image: I1;
    info: I2;
    constructor(image: I1, info: I2);
    get key(): string;
    get_type(): string;
    clone(): this;
    translate(dx: number, dy: number): ConcreteImage;
    compile(): ImageCompilation;
    grids(): Generator<Grid, void, unknown>;
    images(): Generator<I1 | I2, void, unknown>;
}
declare function translate<I extends ConcreteImage>(x: number, y: number, image: I): Translation<I>;
declare function set_background<I extends ConcreteImage>(color: Color, image: I): BackgroundColor<I>;
declare function make_object_list<I extends ConcreteImage>(list: I[]): SubImages<I>;
declare function make_rotation<I extends ConcreteImage>(image: I): SubImages<ImageTransformation<I>>;
declare function make_image_window<I extends ConcreteImage>(image: I): ImageWindow<I>;
declare function fbasic_grid(grid: Grid): BasicImage;
declare function build_decomposer(decomposer: Decomposer): (grid: Grid) => ConcreteImage;
declare function decomposer_to_list(decomposer: Decomposer): string[];
interface Decomposer {
    name: string;
    decomposer?: Decomposer;
    decomposer2?: Decomposer;
    decomposers?: Decomposer[];
    transform?: Transform;
    background_color?: Color;
    abstraction_name?: string;
    fixed_size?: boolean;
    default_grid_color?: Color;
    sx?: number;
    sy?: number;
    nx?: number;
    ny?: number;
    failed?: boolean;
}
declare function image_window(decomposer: Decomposer): Decomposer;
declare const basic_grid: Decomposer;
declare function object_list(decomposer: Decomposer): Decomposer;
declare function object_list2(decomposer: Decomposer): Decomposer;
declare function block_list(decomposer: Decomposer): Decomposer;
declare function scaled(decomposer: Decomposer): Decomposer;
declare function tile(decomposer: Decomposer): Decomposer;
declare function tile_x(decomposer: Decomposer): Decomposer;
declare function tile_y(decomposer: Decomposer): Decomposer;
declare function transform(transform: Transform, decomposer: Decomposer): Decomposer;
declare const semantic_box: Decomposer;
declare function trim_object(decomposer: Decomposer): Decomposer;
declare function trim_object_center(decomposer: Decomposer): Decomposer;
declare function monochrome(decomposer: Decomposer): Decomposer;
declare const solid_color: Decomposer;
declare function background(background_color: Color | undefined, decomposer: Decomposer): Decomposer;
declare function color_decomposition(decomposer: Decomposer): Decomposer;
declare function monochrome_object_list(decomposer: Decomposer): Decomposer;
declare function monochrome_object_list_abstraction(abstraction_name: string, decomposers: Decomposer[]): Decomposer;
declare function monochrome_decomposition_abstraction(abstraction_name: string, decomposers: Decomposer[]): Decomposer;
declare function simple_abstraction(abstraction_name: string, decomposer: Decomposer): Decomposer;
declare function monochrome_object_list2(decomposer: Decomposer): Decomposer;
declare function horizontal_decomposition(decomposer: Decomposer, fixed_size?: boolean): Decomposer;
declare function complement(decomposer: Decomposer): Decomposer;
declare function find_master_grid(decomposer: Decomposer, default_grid_color?: Color, fixed_size?: boolean): Decomposer;
declare function master_grid(sx: number, sy: number, decomposer: Decomposer): Decomposer;
declare function master_grid2(nx: number, ny: number, decomposer: Decomposer): Decomposer;
declare const pixel_grid: Decomposer;
declare function add_info(decomposer: Decomposer, decomposer2: Decomposer): Decomposer;
declare function centered(decomposer: Decomposer): Decomposer;
declare function alternatives(decomposers: Decomposer[]): Decomposer;
declare function normalize_decomposer(decomposer: Decomposer): Decomposer;
declare function decomposer_to_key(decomposer?: Decomposer | Decomposer[]): string;
declare const root_decomposers: Set<string>;
declare function decomposer_clone(decomposer: Decomposer): Decomposer;
declare function decomposer_remove_failed_alternatives(decomposer: Decomposer): Decomposer;
declare function decomposer_prefix(decomposer: Decomposer): Decomposer | undefined;
declare function decomposer_root(decomposer: Decomposer): Decomposer | undefined;
declare function decomposer_suffix(decomposer: Decomposer): Decomposer | Decomposer[] | undefined;
declare class MetaGrid<X> {
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
declare class Grid extends MetaGrid<Color> {
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
declare function set_logging(value: boolean): void;
declare function log(...rest: unknown[]): void;
declare function log_error(...rest: unknown[]): void;
declare function eqSet<X>(a: Set<X>, b: Set<X>): boolean;
declare function set_equal<X>(a: Set<X>, b: Set<X>): boolean;
declare function set_union<X>(...all_sets: Set<X>[]): Set<X>;
declare function set_intersection_equal<X>(a: Set<X>, b: Set<X>): void;
declare function set_intersection<X>(...rest: Set<X>[]): Set<X>;
declare function count<A>(list: A[], test: (a: A) => boolean): number;
declare function functionRaiser<A, B, T>(t: (b: B) => A): (f: (a: A, ...indices: number[]) => T) => ((b: B, ...indices: number[]) => T);
declare function highest<X>(objs: X[] | Set<X>, func: (x: X) => number): X | undefined;
declare function lowest<X>(objs: X[] | Set<X>, func: (x: X) => number): X | undefined;
declare function highests<X>(objs: X[] | Set<X>, func: (x: X) => number): X[];
declare function lowests<X>(objs: X[] | Set<X>, func: (x: X) => number): X[];
declare function select<X>(objs: X[] | Set<X>, test: (x: X) => boolean): X | undefined;
declare function selects<X>(objs: X[] | Set<X>, test: (x: X) => boolean): X[];
declare function count_items<X>(objs: X[]): Map<X, number>;
declare function make_permutation_set(n: number): Set<number[]>;
declare function count_bits(n: bigint): number;
declare function bitfield_to_string(bitfield: bigint): string;
declare function booleans_to_bitfield(values: boolean[]): bigint;
declare function append_vectors<X>(...vectors: X[][]): X[];
declare function all<X>(v: X[], test: (x: X) => boolean): boolean;
declare function range(n: number): Generator<number, void, unknown>;
declare function first_n<X>(n: number, generator: Generator<X>): Generator<X>;
declare class GenericError<T> {
    message: string;
    data: T;
    constructor(message: string, data: T);
}
declare function operator_v<T>(oper: (a: T, b: T) => T): (v: T[]) => T;
declare const bitfield_or_v: (v: bigint[]) => bigint;
declare const bitfield_and_v: (v: bigint[]) => bigint;
declare function random_permutation<X>(list: X[]): X[];
declare function random_element<X>(xs: X[]): X | undefined;
declare function solution(decomposer: Decomposer, transform: (image: ConcreteImage) => ConcreteImage): {
    solver: (grid: Grid) => Grid;
};
declare function solution2(decomposer_input: Decomposer, decomposer_output: Decomposer, transform?: (image: ConcreteImage) => ConcreteImage): {
    solver?: (grid: Grid) => Grid;
    decomposer_input: (grid: Grid) => ConcreteImage;
    decomposer_output: (grid: Grid) => ConcreteImage;
    decomposer_input_data: Decomposer;
    decomposer_output_data: Decomposer;
};
declare function rasterize(decomposer: Decomposer): {
    rasterizer: boolean;
    decomposer_input: (grid: Grid) => ConcreteImage;
};
declare function evaluate_solver(code: string): {
    solver: (grid: Grid) => Grid;
    rasterizer?: boolean;
    decomposer_input?: (grid: Grid) => ConcreteImage;
    decomposer_output?: (grid: Grid) => ConcreteImage;
    decomposer_input_data: Decomposer;
    decomposer_output_data: Decomposer;
};
type ImageFunction<I, T> = (image: I, ...indices: number[]) => T;
declare class F<T> {
    name: string;
    path: string;
    _f: ImageFunction<SymbolicImage, T>;
    f: ImageFunction<SymbolicImage, T>;
    constructor(name: string, f: ImageFunction<SymbolicImage, T>, path_is_name?: boolean);
    static make<T, I>(name: string, f?: ImageFunction<I, T> | T, index?: number, path_is_name?: boolean): F<T>;
    prefix(field: string | PathFunction): F<T>;
    prefix_list(field: string, index: number): F<T>;
    prefix_generation(f_sub_images: string | F<SymbolicImage[]>, generation: number): F<T>;
    static operator<T1, T2, T3>(symbol: string, oper: (a: T1, b: T2) => T3): (a: F<T1> | T1, b: F<T2> | T2) => F<T3>;
    static operator_v<T>(symbol: string, oper: (a: T, b: T) => T): (v: F<T>[]) => F<T>;
    static not(a: F<boolean>): F<boolean>;
    static ifthenelse<T>(condition: F<boolean>, a: F<T> | T, b: F<T> | T): F<T>;
    static plus: (a: number | F<number>, b: number | F<number>) => F<number>;
    static minus: (a: number | F<number>, b: number | F<number>) => F<number>;
    static equals: (a: number | F<number>, b: number | F<number>) => F<boolean>;
    static not_equals: (a: number | F<number>, b: number | F<number>) => F<boolean>;
    static lower_than: (a: number | F<number>, b: number | F<number>) => F<boolean>;
    static bigger_than: (a: number | F<number>, b: number | F<number>) => F<boolean>;
    static lower_or_equal_to: (a: number | F<number>, b: number | F<number>) => F<boolean>;
    static bigger_or_equal_to: (a: number | F<number>, b: number | F<number>) => F<boolean>;
    static mod: (a: number | F<number>, b: number | F<number>) => F<number>;
    static and: (a: boolean | F<boolean>, b: boolean | F<boolean>) => F<boolean>;
    static or: (a: boolean | F<boolean>, b: boolean | F<boolean>) => F<boolean>;
    static times: (a: number | F<number>, b: number | F<number>) => F<number>;
    static plus_v: (v: F<number>[]) => F<number>;
    static minus_v: (v: F<number>[]) => F<number>;
    static and_v: (v: F<boolean>[]) => F<boolean>;
    static or_v: (v: F<boolean>[]) => F<boolean>;
    static times_v: (v: F<number>[]) => F<number>;
}
type PathFunction = F<SymbolicImage>;
type NumberFunction = F<number>;
type ColorFunction = F<Color>;
type GridFunction = F<Grid>;
type SubImagesFunction = F<SymbolicImage[]>;
declare function number_function(name: string): NumberFunction;
declare function color_function(name: string): ColorFunction;
declare function grid_function(name: string): GridFunction;
declare function image_function(name: string): PathFunction;
declare function prefix<T>(field: string | PathFunction): (f: F<T>) => F<T>;
declare function prefix_list<T>(field: string, index: number): (f: F<T>) => F<T>;
declare function prefix_generation<T>(f_sub_images: F<SymbolicImage[]> | string, generation: number): (f: F<T>) => F<T>;
type BooleanFunction = F<boolean>;
declare class CantBuildNumberFunction {
    number_function: NumberFunction;
    constructor(number_function: NumberFunction);
}
declare class CantBuildColorFunction {
    color_function: ColorFunction;
    constructor(color_function: ColorFunction);
}
declare class CantBuildGridFunction {
    grid_function: GridFunction;
    constructor(grid_function: GridFunction);
}
interface DualFunction {
    type: 'number' | 'color' | 'grid';
    func: NumberFunction;
    generation: number;
    values: number[];
}
type RecArray<X> = X[] | RecArray<X>[];
declare function map_rec_array<X, Y>(rec_array: RecArray<X>, f: (x: X, i: number) => Y): RecArray<Y>;
declare function any_rec_array<X>(rec_array: RecArray<X>, f: (x: X) => boolean): boolean;
declare function flatten_rec_array<X>(rec_array: RecArray<X>): X[];
interface SubFunctions {
    length_function: NumberFunction;
    index_function: NumberFunction;
    sub_images_functions: SubImagesFunction[];
    number_functions: NumberFunction[];
    color_functions: ColorFunction[];
    grid_number_functions: NumberFunction[];
}
declare class Sample {
    unmask_index: number;
    indices: number[];
    input_image: SymbolicImage;
    input_index_0: number;
    input_indices: number[];
    output_image: SymbolicImage;
    output_index_0: number;
    output_indices: number[];
    constructor(unmask_index: number, indices: number[], input_image: SymbolicImage, input_index_0: number, input_indices: number[], output_image: SymbolicImage, output_index_0: number, output_indices: number[]);
    get index(): bigint;
    input<X>(f: ImageFunction<SymbolicImage, X> | F<X>): X;
    dual_input(f: DualFunction): number;
    output<X>(f: ImageFunction<SymbolicImage, X> | F<X>, output_is_input: boolean): X;
    output_mapping<X>(mapping: RecArray<X> | X, final_index: number): X;
    get_mapping<X>(mapping: RecArray<X> | X): X;
    set_mapping<X>(mapping: RecArray<X> | X, x: X): void;
    test_mapping(mapping: RecArray<number> | BooleanFunction | undefined, i: number): boolean;
    raise(unmask_index: number, index: number, input_index: number, output_index: number): Sample;
}
interface SolverOptions {
    no_mapping?: boolean;
    no_same_check?: boolean;
    no_decision_tree?: boolean;
    no_equal?: boolean;
    no_sub_table_analysis?: boolean;
}
declare class Solver {
    options: SolverOptions;
    seen_dual: Set<string>;
    output_dual_number: Map<string, NumberFunction | 'failed'>;
    output_dual_color: Map<string, ColorFunction | 'failed'>;
    output_dual_grid: Map<string, GridFunction | 'failed'>;
    parent?: Solver;
    timeout: boolean;
    generation: number;
    mapping?: RecArray<number> | BooleanFunction;
    number_functions: DualFunction[];
    color_functions: DualFunction[];
    grid_number_functions: DualFunction[];
    generic_functions: DualFunction[];
    additional_number_functions: DualFunction[];
    additional_color_functions: DualFunction[];
    additional_grid_number_functions: DualFunction[];
    sub_images_functions: SubImagesFunction[];
    sub_images_sub_images_functions: SubImagesFunction[][];
    sub_images_number_functions: NumberFunction[][];
    sub_images_color_functions: ColorFunction[][];
    sub_images_grid_number_functions: NumberFunction[][];
    sub_images_generic_functions: NumberFunction[][];
    sub_images_table_analysis: TableAnalysis[];
    boolean_functions: Map<bigint, BooleanFunction>;
    grids: Grid[];
    grid_index: {
        [grid: string]: number;
    };
    samples_mask: bigint;
    samples_count: number;
    tick: number;
    protected marked: boolean;
    constructor(options?: SolverOptions);
    setTimeout(delay: number): void;
    private setTimeoutNow;
    check_timeout(): Promise<void>;
    private checkTimeoutNow;
    mark(): void;
    is_marked(): boolean;
    compute_samples_mask(): void;
    raise_grid_number_function: (gf: GridFunction) => NumberFunction;
    raise_grid_function: (nf: NumberFunction) => GridFunction;
    samples: (_mask?: bigint) => Generator<Sample, void, unknown>;
    static make(input_images: SymbolicImage[], output_images: SymbolicImage[], options?: SolverOptions): Promise<Solver>;
    private init;
    sub_init(solver: Solver, sub_functions: SubFunctions, mapping?: RecArray<number> | BooleanFunction, boolean_function?: BooleanFunction): Promise<void>;
    private sibbling_init;
    get_functions(type: 'number' | 'color' | 'grid' | 'generic'): DualFunction[];
    raise_dual(func: NumberFunction, type: 'number' | 'color' | 'grid', is_input?: boolean): DualFunction;
    filter_dual: (dual_func: DualFunction) => boolean;
    raise_mod_n(n: number): (func: NumberFunction) => F<number>;
    raise_dual_number: (func: NumberFunction) => DualFunction;
    raise_dual_color: (func: NumberFunction) => DualFunction;
    raise_dual_grid: (func: NumberFunction) => DualFunction;
    raise_dual_output_number: (func: NumberFunction) => DualFunction;
    raise_dual_output_color: (func: NumberFunction) => DualFunction;
    raise_dual_output_grid: (func: GridFunction) => DualFunction;
    restrict_dual: (dual_func: DualFunction) => {
        values: number[];
        type: "number" | "color" | "grid";
        func: NumberFunction;
        generation: number;
    };
    compute_boolean_functions(): Promise<void>;
    make_sub_solver(sub_functions: SubFunctions, mapping?: RecArray<number> | BooleanFunction, given_boolean_function?: BooleanFunction): Promise<{
        sub_solver: Solver;
        boolean_function: BooleanFunction;
        length_function: NumberFunction;
    } | undefined>;
    sub_functions(): Generator<SubFunctions>;
    find_mapping_sub_solvers(output_sub_images_function: ImageFunction<SymbolicImage, SymbolicImage[]>): AsyncGenerator<{
        sub_solver: Solver;
        boolean_function: BooleanFunction;
        length_function: NumberFunction;
    }>;
    output_first_level<X>(f: F<X>, input_is_output?: boolean): X[] | undefined;
    add_grid(grid: Grid): void;
    first_sample(mask?: bigint): Sample;
    is_constant_output(f: NumberFunction, output_is_input?: boolean): boolean;
    select_boolean_function(positives: bigint, negatives: bigint): Promise<BooleanFunction>;
    enum_boolean_functions(positives: bigint, negatives: bigint): AsyncGenerator<BooleanFunction>;
    enum_boolean_selectors(): AsyncGenerator<BooleanFunction, void, unknown>;
    enum_valid_boolean_terms(positives: bigint, negatives: bigint): AsyncGenerator<{
        bitfield: bigint;
        boolean_function: BooleanFunction;
    }, void, unknown>;
    select_best_function(f: NumberFunction, output_is_input: boolean, type: 'color' | 'grid'): Promise<{
        bitfield: bigint;
        func: F<number>;
    }>;
    enum_mapping_functions(f: NumberFunction, output_is_input?: boolean): AsyncGenerator<NumberFunction>;
    select_decision_tree_function(f: NumberFunction, output_is_input: boolean, type: 'number' | 'color' | 'grid'): Promise<NumberFunction>;
    select_color_function(f: ColorFunction, output_is_input?: boolean): Promise<ColorFunction>;
    build_color_function(f: ColorFunction, output_is_input?: boolean): Promise<ColorFunction>;
    enum_color_functions(f: ColorFunction, output_is_input?: boolean): AsyncGenerator<ColorFunction>;
    select_number_function(f: NumberFunction, output_is_input?: boolean): Promise<NumberFunction>;
    build_number_function(f: NumberFunction, output_is_input?: boolean): Promise<NumberFunction>;
    enum_number_functions(f: NumberFunction, output_is_input?: boolean): AsyncGenerator<NumberFunction>;
    select_grid_function(f: GridFunction, output_is_input?: boolean): Promise<GridFunction>;
    build_grid_function(f: GridFunction, output_is_input?: boolean): Promise<GridFunction>;
    enum_grid_functions(f: GridFunction, output_is_input?: boolean): AsyncGenerator<GridFunction>;
}
{};
declare class SymbolicImage {
    number_functions(): NumberFunction[];
    color_functions(): ColorFunction[];
    grid_functions(): GridFunction[];
    sub_images_functions(): SubImagesFunction[];
    to_grid(): Grid;
    grids(): Generator<Grid>;
}
interface ColumnDescription {
    indices: number[];
    count: boolean;
    rank: boolean;
    inv_rank: boolean;
    type: 'number' | 'color' | 'grid';
}
declare class TableAnalysis {
    private solver;
    private mapping;
    private length_function;
    private index_function;
    private generic_functions;
    columns_desc: ColumnDescription[];
    columns_samples: (number | null)[][][];
    columns_map: Map<number, number>;
    constructor(solver: Solver, mapping: BooleanFunction | undefined, length_function: NumberFunction, index_function: NumberFunction, generic_functions: NumberFunction[]);
    static make(solver: Solver, mapping: BooleanFunction | undefined, length_function: NumberFunction, index_function: NumberFunction, generic_functions: NumberFunction[], counts: number[]): Promise<TableAnalysis>;
    init([number_count, color_count, _grid_count]: number[]): Promise<void>;
    enum_functions(type: 'number' | 'color' | 'grid', values: number[]): AsyncGenerator<NumberFunction>;
    build_function(inputs: (NumberFunction | number | 'min' | 'max' | 'index')[], inputs_desc: ColumnDescription[], output_desc: ColumnDescription): NumberFunction;
    build_index_dual_function(output_desc: ColumnDescription, values: number[]): DualFunction;
    get_extended_number_functions(): DualFunction[];
}
{};
declare enum Transform {
    identity = 0,
    flip_x = 1,
    flip_y = 2,
    rotate_90 = 3,
    rotate_180 = 4,
    rotate_270 = 5,
    transpose = 6,
    opposite_transpose = 7,
    tile_x = 8,
    tile_y = 9,
    tile = 10,
    ping_pong_x = 11,
    ping_pong_y = 12,
    ping_pong = 13,
    rotation = 14
}
