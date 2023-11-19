import { Color } from "./Color";
import { Grid } from "./Grid";
import { F, ImageFunction, PathFunction, Solver } from "./Solver";
import { Transform } from "./Transform";
import { SymbolicImage } from "./SymbolicImage";
export declare class ImageCompilation {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    at: (x: number, y: number) => Color;
    constructor(x0: number, y0: number, x1: number, y1: number, at: (x: number, y: number) => Color);
    generate_grid(): Grid;
}
export declare class ConcreteImage extends SymbolicImage {
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
export declare class BasicImage extends ConcreteImage {
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
export declare class SemanticBox extends ConcreteImage {
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
export declare class MonochromeColor<I extends ConcreteImage> extends ConcreteImage {
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
export declare class Alternatives extends ConcreteImage {
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
export declare class ImageData<I extends ConcreteImage> extends ConcreteImage {
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
export declare class BackgroundColor<I extends ConcreteImage> extends ConcreteImage {
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
export declare class SubImages<I extends ConcreteImage> extends ConcreteImage {
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
export declare class ImageWindow<I extends ConcreteImage> extends ConcreteImage {
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
export declare class Scale<I extends ConcreteImage> extends ConcreteImage {
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
export type AnchorType = 0 | 1 | 'center' | 'zero';
export declare class Translation<I extends ConcreteImage> extends ConcreteImage {
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
export declare class ImageTransformation<I extends ConcreteImage> extends ConcreteImage {
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
export declare class BackgroundPixel extends ConcreteImage {
    get key(): string;
    get_type(): string;
    clone(): this;
    translate(dx: number, dy: number): ConcreteImage;
    compile(): ImageCompilation;
}
export declare class Pixel extends ConcreteImage {
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
export declare class SolidColor extends ConcreteImage {
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
export declare class Procedural extends ConcreteImage {
    at: (x: number, y: number) => Color;
    constructor(at: (x: number, y: number) => Color);
    get key(): string;
    get_type(): string;
    clone(): this;
    translate(dx: number, dy: number): ConcreteImage;
    compile(): ImageCompilation;
}
export declare class Concentric<I extends ConcreteImage> extends ConcreteImage {
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
export declare class Info<I1 extends ConcreteImage, I2 extends ConcreteImage> extends ConcreteImage {
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
export declare function translate<I extends ConcreteImage>(x: number, y: number, image: I): Translation<I>;
export declare function set_background<I extends ConcreteImage>(color: Color, image: I): BackgroundColor<I>;
export declare function make_object_list<I extends ConcreteImage>(list: I[]): SubImages<I>;
export declare function make_rotation<I extends ConcreteImage>(image: I): SubImages<ImageTransformation<I>>;
export declare function make_image_window<I extends ConcreteImage>(image: I): ImageWindow<I>;
