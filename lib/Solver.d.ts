import { Color } from "./Color";
import { Grid } from "./Grid";
import { SymbolicImage } from "./SymbolicImage";
import { TableAnalysis } from "./TableAnalyser";
export type ImageFunction<I, T> = (image: I, ...indices: number[]) => T;
export declare class F<T> {
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
export type PathFunction = F<SymbolicImage>;
export type NumberFunction = F<number>;
export type ColorFunction = F<Color>;
export type GridFunction = F<Grid>;
export type SubImagesFunction = F<SymbolicImage[]>;
export declare function number_function(name: string): NumberFunction;
export declare function color_function(name: string): ColorFunction;
export declare function grid_function(name: string): GridFunction;
export declare function image_function(name: string): PathFunction;
export declare function prefix<T>(field: string | PathFunction): (f: F<T>) => F<T>;
export declare function prefix_list<T>(field: string, index: number): (f: F<T>) => F<T>;
export declare function prefix_generation<T>(f_sub_images: F<SymbolicImage[]> | string, generation: number): (f: F<T>) => F<T>;
export type BooleanFunction = F<boolean>;
export declare class CantBuildNumberFunction {
    number_function: NumberFunction;
    constructor(number_function: NumberFunction);
}
export declare class CantBuildColorFunction {
    color_function: ColorFunction;
    constructor(color_function: ColorFunction);
}
export declare class CantBuildGridFunction {
    grid_function: GridFunction;
    constructor(grid_function: GridFunction);
}
export interface DualFunction {
    type: 'number' | 'color' | 'grid';
    func: NumberFunction;
    generation: number;
    values: number[];
}
export type RecArray<X> = X[] | RecArray<X>[];
export declare function map_rec_array<X, Y>(rec_array: RecArray<X>, f: (x: X, i: number) => Y): RecArray<Y>;
export declare function any_rec_array<X>(rec_array: RecArray<X>, f: (x: X) => boolean): boolean;
export declare function flatten_rec_array<X>(rec_array: RecArray<X>): X[];
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
export interface SolverOptions {
    no_mapping?: boolean;
    no_same_check?: boolean;
    no_decision_tree?: boolean;
    no_equal?: boolean;
    no_sub_table_analysis?: boolean;
}
export declare class Solver {
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
    static make(input_images: SymbolicImage[], output_images: SymbolicImage[], options?: SolverOptions, timeout?: number): Promise<Solver>;
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
export {};
