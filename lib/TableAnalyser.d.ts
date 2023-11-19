import { BooleanFunction, DualFunction, NumberFunction, Solver } from "./Solver";
interface ColumnDescription {
    indices: number[];
    count: boolean;
    rank: boolean;
    inv_rank: boolean;
    type: 'number' | 'color' | 'grid';
}
export declare class TableAnalysis {
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
export {};
