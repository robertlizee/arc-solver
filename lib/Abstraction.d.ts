import { Color } from "./Color";
import { Grid } from "./Grid";
import { Solver, ImageFunction, BooleanFunction, NumberFunction, ColorFunction, GridFunction, F, PathFunction, SolverOptions } from "./Solver";
import { SymbolicImage } from "./SymbolicImage";
import { ConcreteImage, ImageCompilation } from "./ConcreteImage";
export declare class Abstraction extends ConcreteImage {
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
