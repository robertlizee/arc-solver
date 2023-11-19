/*
 * MIT License

 * Copyright (c) 2023 Robert Lizee

 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:

 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { Color } from "./Color";
import { fbasic_grid as basic_grid } from "./Decomposers";
import { Grid } from "./Grid";
import { append_vectors, bitfield_or_v, bitfield_to_string, booleans_to_bitfield, count_bits, GenericError, make_permutation_set, set_intersection, set_union } from "./Misc";
import { SymbolicImage } from "./SymbolicImage";
import { BackgroundColor, ImageTransformation, SubImages } from "./ConcreteImage";
import { TableAnalysis } from "./TableAnalyser";
import { Transform } from "./Transform";
import { log, log_error } from "./Logger";

export type ImageFunction<I, T> = (image: I, ...indices: number[]) => T;


export class F<T> {
    path: string;
    _f: ImageFunction<SymbolicImage, T>
    f: ImageFunction<SymbolicImage, T>

    constructor(public name: string, f: ImageFunction<SymbolicImage, T>, path_is_name = false) {
        this.path = path_is_name? name : `@${name}`;
        this._f = this.f = (image, ...indices) => {
            try {
                const result = f(image, ...indices);

                /*if (result === undefined) {
                    log('result undefined');
                    log({ path: this.path, image: image, indices });
                }*/

                return result;
            } catch (e) {
                throw new GenericError("Error accessing element!", { path: this.path, image: image, indices, error: e })
            }
        };
    }

    static make<T, I>(name: string, f?: ImageFunction<I, T> | T, index?: number, path_is_name = false): F<T>
    {
        if (index === undefined) {
            if (f !== undefined) {
                if (typeof(f) === 'function') {
                    // deno-lint-ignore no-explicit-any
                    return new F(name, f as any, path_is_name);
                } else {
                    return new F(name, (_image, ..._indices) => f, true);
                }
            } else {
                // deno-lint-ignore no-explicit-any
                return new F(name, image => (image as any)[name], path_is_name);
            }    
        } else {
            const name_extended = `${name}[${index}]`;
            if (f !== undefined) {
                if (typeof(f) === 'function') {
                    // deno-lint-ignore no-explicit-any
                    return new F(name_extended, (image, ...indices) => (f as any)(image, ...indices)[index], path_is_name);
                } else {
                    // deno-lint-ignore no-explicit-any
                    return new F(name_extended, (_image, ..._indices) => (f as any)[index], path_is_name);
                }
            } else {
                return new F(name_extended, image => {
                    // deno-lint-ignore no-explicit-any
                    const retval = (image as any)[name][index];

                    /*if (retval === undefined) {
                        log(`error ${name} and ${index}`);
                        // deno-lint-ignore no-explicit-any
                        log({ [name]: [...(image as any)[name]] });
                    }*/

                    return retval;
                }, path_is_name);
            }    
        }
    }

    prefix(field: string | PathFunction) {
        const f = this._f;

        if (typeof(field) === 'string') {
            // deno-lint-ignore no-explicit-any
            const newF = new F(this.name, (image, ...indices) => f((image as any)[field], ...indices));

            //newF.path = `${field}.${this.path}`;
            newF.path = this.path.split('@').join(`@${field}.`);

            return newF;
        } else {
            const pathf = field._f;
            const newF = new F(this.name, (image, ...indices) => f(pathf(image, ...indices)!, ...indices));

            //newF.path = `${field.path}.${this.path}`;
            newF.path = this.path.split('@').join(`${field.path}.`);
   
            return newF;
        }
    }

    prefix_list(field: string, index: number) {
        const f = this._f;
        // deno-lint-ignore no-explicit-any
        const newF = new F(this.name, (image, ...indices) => f((image as any)[field][index], ...indices));

        //newF.path = `${field}[${index}].${this.path}`;
        newF.path = this.path.split('@').join(`@${field}[${index}].`);

        return newF;
    }

    prefix_generation(f_sub_images: string | F<SymbolicImage[]>, generation: number) {
        const f = this._f;
        if (typeof(f_sub_images) === 'string') {
            // deno-lint-ignore no-explicit-any
            const newF = new F(this.name, (image, ...indices) => f((image as any)[f_sub_images][indices[generation]], ...indices.slice(generation+1)));

            //newF.path = `${f_sub_images}[i${generation}].${this.path}`;
            newF.path = this.path.split('@').join(`@${f_sub_images}[i${generation}].`);

            return newF;
        } else {
            const path = f_sub_images._f;

            const newF = new F(this.name, (image, ...indices) => f(path(image, ...indices)[indices[generation]], ...indices.slice(generation+1)));
    
            //newF.path = `${f_sub_images.path}[i${generation}].${this.path}`;
            newF.path = this.path.split('@').join(`${f_sub_images.path}[i${generation}].`);
    
            return newF;
            }
    }

    static operator<T1, T2, T3>(symbol: string, oper: (a: T1, b: T2) => T3) {
        return (a: F<T1>|T1, b: F<T2>|T2) => {
            if (a instanceof F) {
                if (b instanceof F) {
                    const fa = a._f;
                    const fb = b._f;
                    
                    const result = new F(`(${a.name} ${symbol} ${b.name})`, (image, ...indices) => oper(fa(image, ...indices), fb(image, ...indices)));
        
                    result.path = `(${a.path} ${symbol} ${b.path})`;
        
                    return result;
    
                } else {
                    const fa = a._f;
                    
                    const result = new F(`(${a.name} ${symbol} ${b})`, (image, ...indices) => oper(fa(image, ...indices), b));
        
                    result.path = `(${a.path} ${symbol} ${b})`;
        
                    return result;
                }
            } else {
                if (b instanceof F) {
                    const fb = b._f;
                    
                    const result = new F(`(${a} ${symbol} ${b.name})`, (image, ...indices) => oper(a, fb(image, ...indices)));
        
                    result.path = `(${a} ${symbol} ${b.path})`;
        
                    return result;
    
                } else {
                    const result = new F(`(${a} ${symbol} ${b})`, (_image, ..._indices) => oper(a, b));
        
                    result.path = `(${a} ${symbol} ${b})`;
        
                    return result;
                }
            }    
        }
    }

    static operator_v<T>(symbol: string, oper: (a: T, b: T) => T) {
        return (v: F<T>[]) => {
            function oper_v(v: T[]): T {
                if (v.length === 0) {
                    throw new Error('Expecting at least 1 argument for oper_v');
                } else {
                    let result = v[0];

                    for (let i = 1; i < v.length; i++) {
                        result = oper(result, v[i]);
                    }

                    return result;
                }
            }
            const result = new F(`(${v.map(e => e.name).join(' ' + symbol + ' ')}`, (image, ...indices) => oper_v(v.map(x => x.f(image, ...indices))));
        
            result.path = `(${v.map(e => e.path).join(' ' + symbol + ' ')}`;

            return result;
        }
    }

    static not(a: F<boolean>) {
        const func = a._f;
        const result = new F(`!${a.name}`, (image, ...indices) => !func(image, ...indices));
        result.path = `!${a.path}`;
        return result;
    }

    static ifthenelse<T>(condition: F<boolean>, a: F<T>|T, b: F<T>|T) {
        const fc = condition._f;

        if (a instanceof F) {
            if (b instanceof F) {
                const fa = a._f;
                const fb = b._f;
                
                const result = new F(`(${condition.name}? ${a.name} : ${b.name})`, (image, ...indices) => fc(image, ...indices)? fa(image, ...indices): fb(image, ...indices));
    
                result.path = `(${condition.path}? ${a.path} : ${b.path})`;
    
                return result;

            } else {
                const fa = a._f;
                
                const result = new F(`(${condition.name}? ${a.name} : ${b})`, (image, ...indices) => fc(image, ...indices)? fa(image, ...indices): b);
    
                result.path = `(${condition.path}? ${a.path} : ${b})`;
    
                return result;

            }
        } else {
            if (b instanceof F) {
                const fb = b._f;
                
                const result = new F(`(${condition.name}? ${a} : ${b.name})`, (image, ...indices) => fc(image, ...indices)? a: fb(image, ...indices));
    
                result.path = `(${condition.path}? ${a} : ${b.path})`;
    
                return result;

            } else {
                const result = new F(`(${condition.name}? ${a} : ${b})`, (image, ...indices) => fc(image, ...indices)? a: b);
    
                result.path = `(${condition.path}? ${a} : ${b})`;
    
                return result;
            }
        }    
    }

    static plus = F.operator('+', (a: number, b: number) => a + b);
    static minus = F.operator('-', (a: number, b: number) => a - b);
    static equals = F.operator('==', (a: number, b: number) => a === b);
    static not_equals = F.operator('!=', (a: number, b: number) => a !== b);
    static lower_than = F.operator('<', (a: number, b: number) => a <  b);
    static bigger_than = F.operator('>', (a: number, b: number) => a > b);
    static lower_or_equal_to = F.operator('<=', (a: number, b: number) => a <= b);
    static bigger_or_equal_to = F.operator('>=', (a: number, b: number) => a >= b);
    static mod = F.operator('%', (a: number, b: number) => a % b);
    static and = F.operator('&&', (a: boolean, b: boolean) => a && b);
    static or = F.operator('||', (a: boolean, b: boolean) => a || b);
    static times = F.operator('*', (a: number, b: number) => a * b);

    static plus_v = F.operator_v('+', (a: number, b: number) => a + b);
    static minus_v = F.operator_v('-', (a: number, b: number) => a - b);
    static and_v = F.operator_v('&&', (a: boolean, b: boolean) => a && b);
    static or_v = F.operator_v('||', (a: boolean, b: boolean) => a || b);
    static times_v = F.operator_v('*', (a: number, b: number) => a * b);
}

export type PathFunction = F<SymbolicImage>
export type NumberFunction = F<number>;
export type ColorFunction = F<Color>;
export type GridFunction = F<Grid>;
export type SubImagesFunction = F<SymbolicImage[]>;

export function number_function(name: string): NumberFunction {
    return F.make(name)
}

export function color_function(name: string): ColorFunction {
    return F.make(name)
}

export function grid_function(name: string): GridFunction {
    return F.make(name)
}

export function image_function(name: string): PathFunction {
    return F.make(name)
}

export function prefix<T>(field: string | PathFunction) {
    return (f: F<T>) => {
        return f.prefix(field);
    }
}

export function prefix_list<T>(field: string, index: number) {
    return (f: F<T>) => {
        return f.prefix_list(field, index);
    }
}

export function prefix_generation<T>(f_sub_images: F<SymbolicImage[]> | string, generation: number) {
    return (f: F<T>) => {
        return f.prefix_generation(f_sub_images, generation);
    }
}


export type BooleanFunction = F<boolean>;

export class CantBuildNumberFunction {
    constructor(public number_function: NumberFunction) {
    }
}

export class CantBuildColorFunction {
    constructor(public color_function: ColorFunction) {
    }
}

export class CantBuildGridFunction {
    constructor(public grid_function: GridFunction) {
    }
}

interface MappingDescription {
    description: number[];
    mapping: RecArray<Set<number>[]>;
}

export interface DualFunction {
    type: 'number' | 'color' | 'grid';
    func: NumberFunction;
    generation: number;
    values: number[];
}

function dual_function_key(func: DualFunction) {
    return `${func.type}: ${func.generation} = [${func.values.map(value => value.toString()).join()}]`;
}

export type RecArray<X> = X[] | RecArray<X>[];

export function map_rec_array<X, Y>(rec_array: RecArray<X>, f: (x: X, i: number) => Y): RecArray<Y> {
    if (rec_array instanceof Array) {
        if (rec_array.length === 0) {
            return [];
        } else {
            const x0 = rec_array[0];
            if (x0 instanceof Array) {
                return rec_array.map(x => map_rec_array(x as RecArray<X>, f));
            } else {
                return (rec_array as X[]).map(f);
            }
        }
    } else {
        throw new Error("Expecting an array");
    }
}

export function any_rec_array<X>(rec_array: RecArray<X>, f: (x: X) => boolean): boolean {
    if (rec_array instanceof Array) {
        if (rec_array.length === 0) {
            return false;
        } else {
            const x0 = rec_array[0];
            if (x0 instanceof Array) {
                for (const sub_rec_array of rec_array as RecArray<X>[]) {
                    if (any_rec_array(sub_rec_array, f)) {
                        return true;
                    }
                }
                return false;
            } else {
                for (const x of rec_array as X[]) {
                    if (f(x)) {
                        return true;
                    }
                }
                return false;
            }
        }
    } else {
        throw new Error("Expecting an array");
    }
}

export function flatten_rec_array<X>(rec_array: RecArray<X>): X[] {
    if (rec_array instanceof Array) {
        if (rec_array.length === 0) {
            return [];
        } else {
            const x0 = rec_array[0];
            if (x0 instanceof Array) {
                return append_vectors(...(rec_array as RecArray<X>[]).map(flatten_rec_array));
            } else {
                return rec_array as X[];
            }
        }
    } else {
        throw new Error("Expecting an array");
    }
}

interface SubFunctions {
    length_function: NumberFunction;
    index_function: NumberFunction;
    sub_images_functions: SubImagesFunction[]
    number_functions: NumberFunction[];
    color_functions: ColorFunction[];
    grid_number_functions: NumberFunction[];
}

class Sample {
    constructor(public unmask_index: number, public indices: number[], public input_image: SymbolicImage, public input_index_0: number, public input_indices: number[], public output_image: SymbolicImage, public output_index_0: number, public output_indices: number[]) {

    }

    get index(): bigint {
        return BigInt(this.indices[this.indices.length-1])
    }

    input<X>(f: ImageFunction<SymbolicImage, X> | F<X>) {
        if (f instanceof F) {
            return f.f(this.input_image, ...this.input_indices);
        } else {
            return f(this.input_image, ...this.input_indices);
        }
    }

    dual_input(f: DualFunction) {
        return f.values[this.indices[f.generation]]
    }

    output<X>(f: ImageFunction<SymbolicImage, X> | F<X>, output_is_input: boolean) {
        if (f instanceof F) {
            if (output_is_input) {
                return f.f(this.input_image, ...this.input_indices);
            } else {
                return f.f(this.output_image, ...this.output_indices);
            }    
        } else {
            if (output_is_input) {
                return f(this.input_image, ...this.input_indices);
            } else {
                return f(this.output_image, ...this.output_indices);
            }    
        }
    }

    output_mapping<X>(mapping: RecArray<X> | X, final_index: number) {
        const update_mapping = (i: number) => {
            if (mapping instanceof Array) {
                mapping = mapping[i];
            } else {
                throw new Error("Expecting an array");
            }
        }
        update_mapping(this.input_index_0);
        for (const index of this.input_indices) {
            update_mapping(index);
        }
        update_mapping(final_index);

        if (mapping instanceof Array) {
            throw new Error("Expecting a value");
        } else {
            return mapping;
        }
    }

    get_mapping<X>(mapping: RecArray<X> | X) {
        const update_mapping = (i: number) => {
            if (mapping instanceof Array) {
                mapping = mapping[i];
            } else {
                throw new Error("Expecting an array");
            }
        }
        update_mapping(this.input_index_0);
        for (const index of this.input_indices) {
            update_mapping(index);
        }
        return mapping as X;
    }

    set_mapping<X>(mapping: RecArray<X> | X, x: X) {
        const update_mapping = (i: number) => {
            if (mapping instanceof Array) {
                if (mapping[i] === undefined) {
                    mapping[i] = [];
                }
                mapping = mapping[i];
            } else {
                throw new Error("Expecting an array");
            }
        }

        if (this.input_indices.length === 0) {
            if (mapping instanceof Array) {
                mapping[this.input_index_0] = x;
            } else {
                throw new Error("Expecting an array");                
            }
        } else {
            update_mapping(this.input_index_0);

            for (let i = 0; i < this.input_indices.length - 1; i++) {
                update_mapping(this.input_indices[i]);
            }
    
            if (mapping instanceof Array) {
                mapping[this.input_indices[this.input_indices.length - 1]] = x;
            } else {
                throw new Error("Expecting an array");                
            }    
        }
    }

    test_mapping(mapping: RecArray<number> | BooleanFunction | undefined, i: number) {
        if (mapping instanceof F) {
            const sub_sample = this.raise(0, 0, i, i);
            return sub_sample.input(mapping);
        } else if (mapping) {
            return this.output_mapping(mapping, i) >= 0;
        } else {
            return true;
        }
    }

    raise(unmask_index: number, index: number, input_index: number, output_index: number) {
        return new Sample(unmask_index, [...this.indices, index], this.input_image, this.input_index_0, [...this.input_indices, input_index], this.output_image, this.output_index_0, [...this.output_indices, output_index]);
    }
}

export interface SolverOptions {
    no_mapping?: boolean;
    no_same_check?: boolean;
    no_decision_tree?: boolean;
    no_equal?: boolean;
    no_sub_table_analysis?: boolean;
}

export class Solver {

    seen_dual: Set<string> = new Set();
    output_dual_number: Map<string, NumberFunction | 'failed'> = new Map();
    output_dual_color: Map<string, ColorFunction | 'failed'> = new Map();
    output_dual_grid: Map<string, GridFunction | 'failed'> = new Map();

    parent?: Solver;

    timeout = false;

    generation = 0;
    mapping?: RecArray<number> | BooleanFunction;
    number_functions: DualFunction[] = [];
    color_functions: DualFunction[] = [];
    grid_number_functions: DualFunction[] = [];
    generic_functions: DualFunction[] = [];
    additional_number_functions: DualFunction[] = [];
    additional_color_functions: DualFunction[] = [];
    additional_grid_number_functions: DualFunction[] = [];
    sub_images_functions: SubImagesFunction[] = [];
    sub_images_sub_images_functions: SubImagesFunction[][] = [];
    sub_images_number_functions: NumberFunction[][] = [];
    sub_images_color_functions: ColorFunction[][] = [];
    sub_images_grid_number_functions: NumberFunction[][] = [];
    sub_images_generic_functions: NumberFunction[][] = [];
    sub_images_table_analysis: TableAnalysis[] = [];

    boolean_functions: Map<bigint, BooleanFunction> = new Map();

    grids: Grid[] = [];
    grid_index: { [grid: string]: number } = {};

    samples_mask = 0n;
    samples_count = 0;

    tick = 0;

    protected marked = false;

    constructor(public options: SolverOptions = {}) {

    }

    setTimeout(delay: number) {
        const solver = new WeakRef(this);

        setTimeout(() => solver.deref()?.setTimeoutNow(), delay)
    }

    private setTimeoutNow() {
        this.timeout = true;
        if (this.parent) {
            this.parent.setTimeoutNow();
        }
    }

    async check_timeout() {
        //if (this.tick++ % 1000 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
            this.checkTimeoutNow();    
        //}
    }

    private checkTimeoutNow() {
        if (this.timeout) {
            throw new Error('Solver timeout !');
        } else if (this.parent) {
            this.parent.checkTimeoutNow()
        }
    }

    mark() {
        console.warn("marked!");
        this.marked = true;
        if (this.parent) {
            this.parent.mark();
        }
    }

    is_marked() {
        return this.marked;
    }

    compute_samples_mask() {
        let index = 0;

        for (const _sample of this.samples()) {
            index++;
        }

        this.samples_mask = (1n << BigInt(index)) - 1n;
        this.samples_count = index;
    }

    raise_grid_number_function = (gf: GridFunction): NumberFunction => {
        const oldf = gf.f;
        const newf: ImageFunction<SymbolicImage, number> = (image, ...indices) => {
            const grid = oldf(image, ...indices);
            if (grid) {
                const key = grid.toString();
                let index = this.grid_index[key];
                if (index !== undefined) {
                    return index;
                } else {
                    index = this.grids.length;
                    this.grids.push(grid);
                    this.grid_index[key] = index;
                    return index;
                }
            } else {
                return -1;
            }    
        }

        const result = F.make(`grid_index(${gf.path})`, newf);
        result.path = result.name;
        return result;
    }

    raise_grid_function = (nf: NumberFunction): GridFunction => {
        const oldf = nf.f;
        const newf: ImageFunction<SymbolicImage, Grid> = (image: SymbolicImage, ...indices: number[]) => {
            return this.grids[oldf(image, ...indices)!]
        }

        return F.make(`grid(${nf.path})`, newf);
    }

    samples: (_mask?: bigint) => Generator<Sample, void, unknown> = function*(_mask = -1n) {};

    static async make(input_images: SymbolicImage[], output_images: SymbolicImage[], options: SolverOptions = {}) {
        const solver = new Solver(options);

        solver.setTimeout(10000);

        await solver.init(input_images, output_images);

        return solver;
    }

    private async init(input_images: SymbolicImage[], output_images: SymbolicImage[]) {

        this.samples = function*(mask = -1n)
        {
            let index = -1;
            for (let i = 0; i < input_images.length; i++) {
                if ((1n << BigInt(++index)) & mask) {
                    yield new Sample(index, [index], input_images[i], i, [], output_images[i], i, []);
                }
            }
        }

        this.compute_samples_mask();

        for (let i = 0; i < input_images.length; i++) {
            const input_image = input_images[i];
            const output_image = output_images[i];

            for (const grid of input_image.grids()) {
                this.add_grid(grid);
            }

            for (const grid of output_image.grids()) {
                this.add_grid(grid);
            }
        }

        log('build_solver');

        this.sub_images_functions = input_images[0].sub_images_functions();

        const first_childs = this.sub_images_functions.map(f => f.f(input_images[0])![0]);

        this.sub_images_sub_images_functions = first_childs.map(first_child => first_child? first_child.sub_images_functions(): []);
        this.sub_images_number_functions = first_childs.map(first_child => first_child? first_child.number_functions(): []);
        this.sub_images_color_functions = first_childs.map(first_child => first_child? first_child.color_functions(): []);
        this.sub_images_grid_number_functions = first_childs.map(first_child => first_child? first_child.grid_functions(): []).map(fs => fs.map(this.raise_grid_number_function));
        this.sub_images_generic_functions = [];

        for (let i = 0; i < this.sub_images_functions.length; i++) {
            const sub_images_function = this.sub_images_functions[i];
            const functions = [...this.sub_images_number_functions[i]!, ...this.sub_images_color_functions[i]!, ...this.sub_images_grid_number_functions[i]!];

            this.sub_images_generic_functions.push(functions);

            const length_function = new F(`${sub_images_function}.length`, (image, ...indices) => sub_images_function.f(image, ...indices).length);
            const number_functions = functions.map(f => {
                const oldf = f.f;
                const newf = (image: SymbolicImage, ...indices: number[]) => oldf(sub_images_function.f(image, ...indices)![indices[this.generation]]);
                return new F(`${sub_images_function.path}[i${this.generation}].${f.path}`, newf);
            });
            // deno-lint-ignore no-explicit-any
            this.sub_images_table_analysis.push(await TableAnalysis.make(this, undefined, length_function, new F('no index', (_image, ..._indices) => undefined as any as number), number_functions, [this.sub_images_number_functions[i]!.length, this.sub_images_color_functions[i]!.length, this.sub_images_grid_number_functions[i]!.length, ]));
        }

        this.number_functions = [...input_images[0].number_functions().map(this.raise_dual_number), ...input_images[0].number_functions().map(this.raise_mod_n(2)).map(this.raise_dual_number)].filter(this.filter_dual);
        this.color_functions = input_images[0].color_functions().map(this.raise_dual_color).filter(this.filter_dual);
        this.grid_number_functions = input_images[0].grid_functions().map(this.raise_grid_number_function).map(this.raise_dual_grid).filter(this.filter_dual);
        this.generic_functions = [...this.number_functions, ...this.color_functions, ...this.grid_number_functions];

        await this.compute_boolean_functions();

        log(input_images);
        log(output_images);
        log(this.generic_functions.map(func => func.func.path));
        log([...this.boolean_functions.values()].map(func => func.path));
    }

    async sub_init(solver: Solver, sub_functions: SubFunctions, mapping?: RecArray<number> | BooleanFunction, boolean_function?: BooleanFunction) {

        await this.check_timeout();

        this.generation = solver.generation + 1;
        this.mapping = mapping;
        this.parent = solver;

        this.options = { ...solver.options, ...this.options };

        this.samples = function*(mask = -1n)
        {
            let index = -1;
            let unmask_index = 0;
            for (const sample of solver.samples()) {
                const count = sample.input(sub_functions.length_function);
                for (let i = 0; i < count; i++) {
                    if (this.mapping instanceof F) {
                        if ((1n << BigInt(++index)) & mask) {
                            const sub_sample = sample.raise(unmask_index, index, i, i);
                            if (sub_sample.input(this.mapping)) {
                                yield sub_sample;
                            }
                        }
                    } else {
                        const j = this.mapping? sample.output_mapping(this.mapping, i) : i;
                        if (j >= 0) {
                            if ((1n << BigInt(++index)) & mask) {
                                yield sample.raise(unmask_index, index, i, j);
                            }
                        }    
                    }
                    unmask_index++;
                }
            }
        }

        this.compute_samples_mask();

        this.grids = solver.grids;
        this.grid_index = solver.grid_index;

        log('build_sub_solver');

        const solver_first_sample = solver.first_sample();

        this.sub_images_functions = solver.sub_images_functions;
        
        this.sub_images_sub_images_functions = solver.sub_images_sub_images_functions;
        this.sub_images_number_functions = solver.sub_images_number_functions;
        this.sub_images_color_functions = solver.sub_images_color_functions;
        this.sub_images_grid_number_functions = solver.sub_images_grid_number_functions;
        
        const additional_sub_image_functions = sub_functions.sub_images_functions;
        const first_childs = additional_sub_image_functions.map(f => solver_first_sample.input(f)![0]);

        const additional_sub_images_sub_images_functions = first_childs.map(first_child => first_child? first_child.sub_images_functions(): []);
        const additional_sub_images_number_functions = first_childs.map(first_child => first_child? first_child.number_functions(): []);
        const additional_sub_images_color_functions = first_childs.map(first_child => first_child? first_child.color_functions(): []);
        const additional_sub_images_grid_functions = first_childs.map(first_child => first_child? first_child.grid_functions(): []);
        const additional_sub_images_grid_number_functions = additional_sub_images_grid_functions.map(fs => fs.map(this.raise_grid_number_function));

        this.sub_images_sub_images_functions = [...solver.sub_images_sub_images_functions, ...additional_sub_images_sub_images_functions];
        this.sub_images_number_functions = [...solver.sub_images_number_functions, ...additional_sub_images_number_functions];
        this.sub_images_color_functions = [...solver.sub_images_color_functions, ...additional_sub_images_color_functions];
        this.sub_images_grid_number_functions = [...solver.sub_images_grid_number_functions, ...additional_sub_images_grid_number_functions];
        
        if (!this.options.no_sub_table_analysis) {
            const table_analysis = await TableAnalysis.make(solver, undefined, sub_functions.length_function, sub_functions.index_function,
                [...sub_functions.number_functions, ...sub_functions.color_functions, ...sub_functions.grid_number_functions],
                [sub_functions.number_functions.length, sub_functions.color_functions.length, sub_functions.grid_number_functions.length]);
    
            if (boolean_function) {
                const table_analysis2 = await TableAnalysis.make(solver, boolean_function, sub_functions.length_function, sub_functions.index_function,
                    [...sub_functions.number_functions, ...sub_functions.color_functions, ...sub_functions.grid_number_functions],
                    [sub_functions.number_functions.length, sub_functions.color_functions.length, sub_functions.grid_number_functions.length]);
            
                    this.additional_number_functions = [...sub_functions.number_functions.map(this.raise_dual_number), 
                        ...table_analysis.get_extended_number_functions().map(this.restrict_dual),
                        ...table_analysis2.get_extended_number_functions()].filter(this.filter_dual);
            } else {
                this.additional_number_functions = [...sub_functions.number_functions.map(this.raise_dual_number), 
                    ...table_analysis.get_extended_number_functions().map(this.restrict_dual)].filter(this.filter_dual);
            }
        }
                
                //this.additional_number_functions = sub_functions.number_functions.map(this.raise_dual_number);
        this.additional_color_functions = sub_functions.color_functions.map(this.raise_dual_color).filter(this.filter_dual);
        this.additional_grid_number_functions = sub_functions.grid_number_functions.map(this.raise_dual_grid).filter(this.filter_dual);
        
        this.sub_images_functions = [...solver.sub_images_functions, ...additional_sub_image_functions];

        this.sub_images_table_analysis = solver.sub_images_table_analysis;
        
        this.number_functions = [...solver.number_functions, 
            ...this.additional_number_functions, 
            ...this.additional_number_functions.map(x => x.func).map(this.raise_mod_n(2)).map(this.raise_dual_number).filter(this.filter_dual)];
        this.color_functions = [...solver.color_functions, ...this.additional_color_functions];
        this.grid_number_functions = [...solver.grid_number_functions, ...this.additional_grid_number_functions];
        this.generic_functions = [...this.number_functions, ...this.color_functions, ...this.grid_number_functions];

        await this.compute_boolean_functions();

        log(this.generic_functions.map(func => func.func.path));
        log([...this.boolean_functions.values()].map(func => func.path));
    }

    private async sibbling_init(solver: Solver, mapping: RecArray<number>) {
        this.generation = solver.generation;
        this.mapping = mapping;
        this.parent = solver.parent;
        this.samples = solver.samples;
        this.compute_samples_mask();
        
        this.grids = solver.grids;
        this.grid_index = solver.grid_index;

        log('build_sibbling_solver');

        this.sub_images_functions = solver.sub_images_functions;

        this.sub_images_sub_images_functions = solver.sub_images_sub_images_functions;
        this.sub_images_number_functions = solver.sub_images_number_functions;
        this.sub_images_color_functions = solver.sub_images_color_functions;
        this.sub_images_grid_number_functions = solver.sub_images_grid_number_functions;
        this.sub_images_table_analysis = solver.sub_images_table_analysis;
        
        this.number_functions = solver.number_functions;
        this.color_functions = solver.color_functions;
        this.grid_number_functions = solver.grid_number_functions;
        this.generic_functions = solver.generic_functions;
        
        this.additional_number_functions = solver.additional_number_functions;
        this.additional_color_functions = solver.additional_color_functions;
        this.additional_grid_number_functions = solver.additional_grid_number_functions;

        await this.compute_boolean_functions();

        await this.check_timeout();

        log(this.generic_functions.map(func => func.func.path));
        log([...this.boolean_functions.values()].map(func => func.path));
    }

    get_functions(type: 'number' | 'color' | 'grid' | 'generic') {
        switch (type) {
            case 'number': return this.number_functions;
            case 'color': return this.color_functions;
            case 'grid': return this.grid_number_functions;
            case 'generic': return this.generic_functions;
        }
    }

    raise_dual(func: NumberFunction, type: 'number' | 'color' | 'grid', is_input = true): DualFunction {
        const values: number[] = [];

        for (const sample of this.samples()) {
            values.push(is_input? sample.input(func)! : sample.output(func, false)!);
        }

        return {
            generation: this.generation,
            func: func,
            values,
            type
        }
    }

    filter_dual = (dual_func: DualFunction) => {
        const key = dual_function_key(dual_func);

        if (!this.seen_dual.has(key)) {
            this.seen_dual.add(key);
            return true;
        } else {
            return false;
        }
    }

    raise_mod_n(n: number) {
        return (func: NumberFunction) => F.mod(func, n);
    }

    raise_dual_number = (func: NumberFunction) => {
        return this.raise_dual(func, 'number');
    }

    raise_dual_color = (func: NumberFunction) => {
        return this.raise_dual(func, 'color');
    }

    raise_dual_grid = (func: NumberFunction) => {
        return this.raise_dual(func, 'grid');
    }

    raise_dual_output_number = (func: NumberFunction) => {
        return this.raise_dual(func, 'number', false);
    }

    raise_dual_output_color = (func: NumberFunction) => {
        return this.raise_dual(func, 'color', false);
    }

    raise_dual_output_grid = (func: GridFunction) => {
        return this.raise_dual(this.raise_grid_number_function(func), 'grid', false);
    }

    restrict_dual = (dual_func: DualFunction) => {
        const values: number[] = [];

        for (const sample of this.samples()) {
            values.push(dual_func.values[sample.unmask_index]);
        }

        return { ...dual_func, values };
    } 

    async compute_boolean_functions() {

        let tick = 0;

        const add_boolean_function = (f: BooleanFunction, values: boolean[]) => {
            let output = 0n;
            let index = 0n;
            for (const value of values) {
                if (value) {
                    output |= 1n << index;
                }
                index++;
            }

            if (output !== 0n && output !== this.samples_mask && !this.boolean_functions.has(output)
                    && (output & (output - 1n)) !== 0n
            ) {
                this.boolean_functions.set(output, f);
            }
        }

        for (let v = 0; v < 5; v++) {
            for (let i = 0; i < this.generic_functions.length; i++) {
                const fi = this.generic_functions[i];
                const rangefi = new Set(fi.values);
                for (const value of rangefi) {
                    if (value === v) {
                        if (tick++ % 1000 === 0) {
                            await this.check_timeout();
                        }
                        add_boolean_function(F.equals(fi.func, value),
                        fi.values.map(v => v === value));
                    }
                }
            }    
        }

        for (let i = 0; i < this.generic_functions.length; i++) {
            const fi = this.generic_functions[i];
            const rangefi = new Set(fi.values);
            for (const value of rangefi) {
                if (tick++ % 1000 === 0) {
                    await this.check_timeout();
                }    
                add_boolean_function(F.equals(fi.func, value),
                    fi.values.map(v => v === value));
            }
        }

        if (!this.options.no_equal) {
            for (let i = 0; i < this.number_functions.length; i++) {
                const fi = this.number_functions[i];
                for (let j = i+1; j < this.number_functions.length; j++) {
                    const fj = this.number_functions[j];
                    if (tick++ % 1000 === 0) {
                        await this.check_timeout();
                    }
                    add_boolean_function(F.equals(fi.func, fj.func),
                        fi.values.map((v, k) => v === fj.values[k]));
                }
            }
            
            for (let i = 0; i < this.color_functions.length; i++) {
                const fi = this.color_functions[i];
                for (let j = i+1; j < this.color_functions.length; j++) {
                    const fj = this.color_functions[j];
                    if (tick++ % 1000 === 0) {
                        await this.check_timeout();
                    }
                    add_boolean_function(F.equals(fi.func, fj.func),
                        fi.values.map((v, k) => v === fj.values[k]));
                }
            }
    
            for (let i = 0; i < this.grid_number_functions.length; i++) {
                const fi = this.grid_number_functions[i];
                for (let j = i+1; j < this.grid_number_functions.length; j++) {
                    const fj = this.grid_number_functions[j];
                    if (tick++ % 1000 === 0) {
                        await this.check_timeout();
                    }
                    add_boolean_function(F.equals(fi.func, fj.func),
                        fi.values.map((v, k) => v === fj.values[k]));
                }
            }    
        }

        for (let i = 0; i < this.number_functions.length; i++) {
            const fi = this.number_functions[i];
            for (let j = 0; j < this.number_functions.length; j++) {
                if (i !== j) {
                    const fj = this.number_functions[j];
                    if (tick++ % 1000 === 0) {
                        await this.check_timeout();
                    }
                    add_boolean_function(F.lower_than(fi.func, fj.func),
                        fi.values.map((v, k) => v < fj.values[k]));    
                }
            }
        }

    }

    async make_sub_solver(sub_functions: SubFunctions, mapping?: RecArray<number> | BooleanFunction, given_boolean_function?: BooleanFunction): Promise<{
                sub_solver: Solver;
                boolean_function: BooleanFunction;
                length_function: NumberFunction;
            } | undefined>
     {
        const sub_solver = new Solver();
        await sub_solver.sub_init(this, sub_functions, mapping, given_boolean_function);

        log('make_sub_solver');

        if (!given_boolean_function && mapping && !(mapping instanceof F) && any_rec_array(mapping, x => x < 0)) {
            const always_sub_solver = new Solver();
            always_sub_solver.sub_init(this, sub_functions);
            const positives = booleans_to_bitfield(flatten_rec_array(mapping).map(v => v >= 0));
            const negatives = always_sub_solver.samples_mask & ~positives;

            const boolean_function = await always_sub_solver.select_boolean_function(positives, negatives);

            if (boolean_function !== undefined) {
                log('sub_solver found!');
                log({ boolean_function: boolean_function.path });
                return { sub_solver: (await this.make_sub_solver(sub_functions, mapping, boolean_function))!.sub_solver, boolean_function, length_function: sub_functions.length_function };
            }
            
        } else {
            const boolean_function = given_boolean_function? given_boolean_function : mapping instanceof F? mapping : F.make('true', true);
            log(mapping);
            return { sub_solver, boolean_function, length_function: sub_functions.length_function };
        }
    }

    *sub_functions(): Generator<SubFunctions> {
        for (let i = 0; i < this.sub_images_functions.length; i++) {
            const input_sub_images_function = this.sub_images_functions[i];

            yield {
                length_function: F.make(`${input_sub_images_function.name}.length`, (image: SymbolicImage, ...indices: number[]) => input_sub_images_function.f(image, ...indices).length),
                index_function: F.make('index', (_image, ...indicies) => indicies[this.generation]),
                sub_images_functions: this.sub_images_sub_images_functions[i].map(prefix_generation(input_sub_images_function, this.generation)),
                number_functions: this.sub_images_number_functions[i].map(prefix_generation(input_sub_images_function, this.generation)),
                color_functions: this.sub_images_color_functions[i].map(prefix_generation(input_sub_images_function, this.generation)),
                grid_number_functions: this.sub_images_grid_number_functions[i].map(prefix_generation(input_sub_images_function, this.generation))              
            }
        }
    }

    async *find_mapping_sub_solvers(output_sub_images_function: ImageFunction<SymbolicImage, SymbolicImage[]>): AsyncGenerator<{
        sub_solver: Solver;
        boolean_function: BooleanFunction;
        length_function: NumberFunction;
    }> {
        const first_sample = this.first_sample();
        const proto_sub_image = first_sample.output(output_sub_images_function, false)![0];
        const output_sub_images_number_functions = proto_sub_image.number_functions();
        const output_sub_images_color_functions = proto_sub_image.color_functions();
        const output_sub_images_grid_functions = proto_sub_image.grid_functions();
        const output_sub_images_grid_number_functions =  output_sub_images_grid_functions.map(this.raise_grid_number_function);
        const output_sub_images_generic_number_functions = [...output_sub_images_number_functions, ...output_sub_images_color_functions, ...output_sub_images_grid_number_functions];

        const output_count: RecArray<number> = [];

        for (const sample of this.samples()) {
            sample.set_mapping(output_count, sample.output(output_sub_images_function, false).length);
        }

        const is_mapping_valid = (mapping: RecArray<Set<number>[]>) => {
            for (const sample of this.samples()) {
                const sets: Set<number>[] = sample.get_mapping(mapping);
                const union = set_union(...sets);
                const count = sample.get_mapping(output_count);
                if (union.size !== count || sets.filter(set => set.size > 0).length < count) {
                    return false;
                }
            }
            return true;
        }

        const is_valid_mapping_solution = (valid_mapping: RecArray<Set<number>[]>) => {
            for (const sample of this.samples()) {
                const sets: Set<number>[] = sample.get_mapping(valid_mapping);

                for (const set of sets) {
                    if (set.size > 1) {
                        return false;
                    }
                }
            }
            return true;
        }

        const to_solution_mapping = (mapping: RecArray<Set<number>[]>) => {
            const result: RecArray<number> = [];

            for (const sample of this.samples()) {
                const sets: Set<number>[] = sample.get_mapping(mapping);

                sample.set_mapping(result as RecArray<number[]>, sets.map(set => set.size > 0? set.values().next().value! : -1));
            }
            return result;
        }

        const mapping_to_string = (mapping: RecArray<Set<number>[]>) => {
            let result = "";
            function set_to_ordered_list(set: Set<number>) {
                const list = [...set];
                list.sort((a, b) => a - b);
                return list;
            }

            for (const sample of this.samples()) {
                const sets: Set<number>[] = sample.get_mapping(mapping);
                result += `[${sets.map(set_to_ordered_list).map(l => `[${l.join(',')}]`).join(',')}],`;
            }
            return result;
        }

        const valid_mapping_intersection = (mapping_a: RecArray<Set<number>[]>, mapping_b: RecArray<Set<number>[]>) => {
            const result: RecArray<Set<number>[]> = [];

            for (const sample of this.samples()) {
                const sets_a: Set<number>[] = sample.get_mapping(mapping_a);
                const sets_b: Set<number>[] = sample.get_mapping(mapping_b);

                const sets_ab: Set<number>[] = [];

                for (let i = 0; i < sets_a.length; i++) {
                    sets_ab.push(set_intersection(sets_a[i], sets_b[i]));
                }

                if (set_union(...sets_ab).size !== sample.get_mapping(output_count)) {
                    return undefined;
                }

                sample.set_mapping(result, sets_ab);
            }

            return result;
        }
        
        for (const sub_function of this.sub_functions()) {
            let enough_sub_images = true;

            for (const sample of this.samples()) {
                if (sample.input(sub_function.length_function) < sample.get_mapping(output_count)) {
                    enough_sub_images = false;
                    break;
                }
            }

            if (enough_sub_images) {

                const seen_mappings: { [key: string]: RecArray<Set<number>[]> } = {};

                const input_generic_number_functions = [...sub_function.number_functions, ...sub_function.color_functions, ...sub_function.grid_number_functions];

                const first_generation_mappings: RecArray<Set<number>[]>[] = [];

                for (const input_number_function of input_generic_number_functions) {
                    for (const output_sub_images_number_function of output_sub_images_generic_number_functions) {
                        const mapping: RecArray<Set<number>[]> = [];
                        let ok = true;
                        let index = 0;
                        for (const sample of this.samples()) {
                            const input_length = sample.input(sub_function.length_function);
                            const output_sub_images = sample.output(output_sub_images_function, false);
                            const output_length = output_sub_images.length;
                            if (input_length < output_length) {
                                ok = false;
                                break;
                            }
                            const input_values: number[] = [];
                            const input_sets: Set<number>[] = [];
                            const input_value_set: Set<number> = new Set();
                            for (let i = 0; i < input_length; i++) {
                                input_sets.push(new Set());
                                index++;
                                const value = sample.raise(index, index, i, i).input(input_number_function)!;
                                input_values.push(value);
                                input_value_set.add(value);
                            }

                            if (input_value_set.size < 2 && output_length > 1) {
                                ok = false;
                                break;
                            }
                            
                            const output_value_set: Set<number> = new Set();
                            for (let j = 0; j < output_length; j++) {
                                const output_sub_image = output_sub_images[j];
                                const output_value = output_sub_images_number_function.f(output_sub_image)!;
                                output_value_set.add(output_value);
                                let count = 0;
                                for (let i = 0; i < input_length; i++) {
                                    if (input_values[i] === output_value) {
                                        input_sets[i].add(j);
                                        count++;
                                    }
                                }
                                if (count === 0) {
                                    ok = false;
                                    break;
                                }
                            }

                            if (!ok) {
                                break;
                            }

                            if (output_value_set.size < 2 && output_length > 1) {
                                ok = false;
                                break;
                            }

                            sample.set_mapping(mapping, input_sets);
                        }
                        if (ok && is_mapping_valid(mapping)) {
                            const mapping_key = mapping_to_string(mapping);
                            if (!seen_mappings[mapping_key]) {
                                seen_mappings[mapping_key] = mapping;
                                if (is_valid_mapping_solution(mapping)) {
                                    const sub_solver = await this.make_sub_solver(sub_function, to_solution_mapping(mapping));
                                    if (sub_solver) {
                                        log('mapping', mapping);
                                        yield sub_solver;
                                    }
                                } else {
                                    first_generation_mappings.push(mapping);
                                }    
                            }
                        }
                    }
                }

                let current_generation_mappings: MappingDescription[] = first_generation_mappings.map((mapping, index) => { return { description: [index], mapping }; });
                let max_generation_count = 1;

                while (current_generation_mappings.length > 0 && max_generation_count-- > 0) {
                    const next_generation_mappings: MappingDescription[] = [];

                    for (const description_mapping of current_generation_mappings) {
                        const current_mapping = description_mapping.mapping;

                        for (let i = description_mapping.description[description_mapping.description.length-1] + 1; i < first_generation_mappings.length; i++) {
                            const additional_mapping = first_generation_mappings[i];

                            const next_mapping = valid_mapping_intersection(current_mapping, additional_mapping);

                            await this.check_timeout();

                            if (next_mapping && is_mapping_valid(next_mapping)) {
                                const mapping_key = mapping_to_string(next_mapping);
                                if (!seen_mappings[mapping_key]) {
                                    seen_mappings[mapping_key] = next_mapping;
                                    if (is_valid_mapping_solution(next_mapping)) {
                                        const sub_solver = await this.make_sub_solver(sub_function, to_solution_mapping(next_mapping));
                                        if (sub_solver) {
                                            log('next mapping', next_mapping)
                                            yield sub_solver;
                                        }
                                    } else {
                                        next_generation_mappings.push({ description: [...description_mapping.description, i], mapping: next_mapping });
                                    }    
                                }
                            }
                        }
                    }

                    current_generation_mappings = next_generation_mappings;
                }
            }
        }
    }

    output_first_level<X>(f: F<X>, input_is_output = false): X[] | undefined {
        const result: X[] = [];

        for (const sample of this.samples()) {
            const x = sample.output(f, input_is_output);
            const index_0 = input_is_output? sample.input_index_0 : sample.output_index_0;
            if (result.length <= index_0) {
                result.push(x);
            } else if (result[index_0] !== x) {
                return undefined;
            }
        }

        return result;
    }

    add_grid(grid: Grid) {
        const grid_key = grid.toString();
        if (this.grid_index[grid_key] === undefined) {
            this.grid_index[grid_key] = this.grids.length;
            this.grids.push(grid);
        }
    }


    first_sample(mask = -1n) {
        for (const sample of this.samples(mask)) {
            return sample;
        }
        throw new Error("There should be at least one sample");
    }

    is_constant_output(f: NumberFunction, output_is_input = false) {
        const n = this.first_sample().output(f, output_is_input);

        if (n === undefined) {
            return false;
        }

        for (const sample of this.samples()) {
            if (sample.output(f, output_is_input) !== n) {
                return false;
            }
        }

        return true;
    }

    async select_boolean_function(positives: bigint, negatives: bigint) {
        for await (const boolean_function of this.enum_boolean_functions(positives, negatives)) {
            return boolean_function;
        }
    }

    async *enum_boolean_functions(positives: bigint, negatives: bigint): AsyncGenerator<BooleanFunction> {
        const all_true_positive_functions: Map<bigint, BooleanFunction> = new Map();
        const all_false_negative_functions: Map<bigint, BooleanFunction> = new Map();
        const mix_functions: Set<bigint> = new Set();

        const classify_function = (boolean_function_output: bigint, f: BooleanFunction, mix_array?: Set<bigint>) => {
            const true_positive = positives & boolean_function_output;
            const false_negative = negatives & ~boolean_function_output;
            const all_true_positive = true_positive === positives;
            const none_true_positive = true_positive === 0n;
            const all_false_negative = false_negative === negatives;
            const none_false_negative = false_negative === 0n;

            if (!(all_true_positive && none_false_negative) && !(none_true_positive && all_false_negative)) {
                if (all_true_positive && all_false_negative) {
                    return f;
                } else if (none_true_positive && none_false_negative) {
                    return F.not(f);
                } else if (all_true_positive) {
                    if (!all_true_positive_functions.has(false_negative)) {
                        all_true_positive_functions.set(false_negative, f);
                    }
                } else if (none_true_positive) {
                    const negs = ~negatives & ~boolean_function_output;
                    if (!all_true_positive_functions.has(negs)) {
                        all_true_positive_functions.set(negs, F.not(f));
                    }
                } else if (all_false_negative) {
                    if (!all_false_negative_functions.has(true_positive)) {
                        all_false_negative_functions.set(true_positive, f);
                    }
                } else if (none_false_negative) {
                    const pos = ~positives & boolean_function_output;
                    if (!all_false_negative_functions.has(pos)) {
                        all_false_negative_functions.set(pos, F.not(f));
                    }
                } else if (mix_array && !mix_array.has(boolean_function_output)) {
                    mix_array.add(boolean_function_output);
                }
            }
        }

        log(this.boolean_functions);

        for (const boolean_function_elem of this.boolean_functions) {

            const classification = classify_function(boolean_function_elem[0], boolean_function_elem[1], mix_functions);

            if (classification) {
                yield classification;
            }
        }

        /*for (const output1 of mix_functions) {
            const f1 = this.boolean_functions.get(output1)!;
            for (const output2 of mix_functions) {
                const f2 = this.boolean_functions.get(output2)!;

                const classification_and = classify_function(output1 & output2, F.and(f1, f2));

                if (classification_and) {
                    yield classification_and;
                }
    
                const classification_and_not = classify_function(output1 & ~output2, F.and(f1, F.not(f2)));

                if (classification_and_not) {
                    yield classification_and_not;
                }
    
                const classification_or = classify_function(output1 | output2, F.or(f1, f2));

                if (classification_or) {
                    yield classification_or;
                }
    
                const classification_or_not = classify_function(output1 | ~output2, F.or(f1, F.not(f2)));

                if (classification_or_not) {
                    yield classification_or_not;
                }
            }
        }*/

        for (const nf1 of all_true_positive_functions) {
            const f1 = nf1[1];
            for (const nf2 of all_true_positive_functions) {
                const f2 = nf2[1];
                if ((nf1[0] | nf2[0]) === negatives) {
                    yield F.and(f1, f2);
                }
            }
        }

        for (const pf1 of all_false_negative_functions) {
            const f1 = pf1[1];
            for (const pf2 of all_false_negative_functions) {
                const f2 = pf2[1];
                if ((pf1[0] | pf2[0]) === positives) {
                    yield F.or(f1, f2);
                }
            }
        }

        for (const nf1 of all_true_positive_functions) {
            const f1 = nf1[1];
            for (const nf2 of all_true_positive_functions) {
                const f2 = nf2[1];
                await this.check_timeout();
                for (const nf3 of all_true_positive_functions) {
                    const f3 = nf3[1];
                    if ((nf1[0] | nf2[0] | nf3[0]) === negatives &&
                            (nf1[0] | nf2[0]) !== negatives && (nf1[0] | nf3[0]) !== negatives && (nf2[0] | nf2[0]) !== negatives
                    ) {
                        yield F.and(f1, F.and(f2, f3));
                    }
                }
            }
        }

        for (const pf1 of all_false_negative_functions) {
            const f1 = pf1[1];
            for (const pf2 of all_false_negative_functions) {
                const f2 = pf2[1];
                await this.check_timeout();
                for (const pf3 of all_true_positive_functions) {
                    const f3 = pf3[1];
                    if ((pf1[0] | pf2[0] | pf3[0]) === positives &&
                            (pf1[0] | pf2[0]) !== positives && (pf1[0] | pf3[0]) !== positives && (pf2[0] | pf2[0]) !== positives
                    ) {
                        yield F.or(f1, F.or(f2, f3));
                    }
                }
            }
        }
    }

    async *enum_boolean_selectors() {
        const group_counts: number[] = [];

        let group_index = 0;
        let group_count = 0;

        for (const sample of this.samples()) {
            log(sample.indices);
            if (sample.indices[0] === group_index) {
                group_count++;
            } else {
                group_counts.push(group_count);
                while (++group_index !== sample.indices[0]) {
                    group_counts.push(0);
                }
                group_count = 1;
            }
        }
        group_counts.push(group_count);
        log([...group_counts]);

        const classify = (boolean_function_output: bigint) => {
            let index = 0n;
            let partial = false;

            for (const group_count of group_counts) {
                let count = 0;

                for (let i = 0; i < group_count; i++) {
                    if ((boolean_function_output & (1n << index++)) !== 0n) {
                        count++;
                    }
                }

                if (count === 0) {
                    return 'failed';
                } else if (count > 1) {
                    partial = true;
                }
            }

            if (!partial) {
                log({ bitfield: bitfield_to_string(boolean_function_output), group_counts });
            }

            return partial? 'partial' : 'success'
        };

        const partial_selectors: Map<bigint, BooleanFunction> = new Map();

        for (const [output, boolean_function] of this.boolean_functions) {
            switch (classify(output)) {
                case 'success':
                    log('success boolean selector')
                    yield boolean_function;
                    break;
                case 'partial':
                    partial_selectors.set(output, boolean_function);
                    break;
            }
            const not_output = ~output;
            const not_boolean_function: BooleanFunction = F.not(boolean_function);
            switch (classify(not_output)) {
                case 'success':
                    log('success boolean selector not')
                    yield not_boolean_function;
                    break;
                case 'partial':
                    partial_selectors.set(not_output, not_boolean_function);
                    break;
            }
        }

        let current_combined_selectors = partial_selectors;
        let nb_steps = 3;

        while (nb_steps-- && current_combined_selectors.size > 0) {
            const next_combined_selector: Map<bigint, BooleanFunction> = new Map();

            for (const [output1, boolean_function1] of partial_selectors) {
                for (const [output2, boolean_function2] of current_combined_selectors) {
                    await this.check_timeout();
                    if (output1 !== output2) {
                        const output = output1 & output2;
                        const boolean_function: BooleanFunction = F.and(boolean_function1, boolean_function2);

                        switch (classify(output)) {
                            case 'success':
                                log('success boolean selector &&')
                                yield boolean_function;
                                break;
                            case 'partial':
                                next_combined_selector.set(output, boolean_function);
                                break;
                        }
                    }
                }
            }

            current_combined_selectors = next_combined_selector;
        }
    }

    async *enum_valid_boolean_terms(positives: bigint, negatives: bigint) {
        const group_counts: number[] = [];

        let group_index = 0;
        let group_count = 0;

        for (const sample of this.samples()) {
            //log(sample.indices);
            if (sample.indices[0] === group_index) {
                group_count++;
            } else {
                group_counts.push(group_count);
                while (++group_index !== sample.indices[0]) {
                    group_counts.push(0);
                }
                group_count = 1;
            }
        }
        group_counts.push(group_count);
        //log([...group_counts]);

        const is_valid = (boolean_function_output: bigint) => {
            let index = 0n;

            for (const group_count of group_counts) {
                let count = 0;

                for (let i = 0; i < group_count; i++) {
                    if ((boolean_function_output & (1n << index++)) !== 0n) {
                        count++;
                    }
                }

                if (count === 0) {
                    return false;
                }
            }

            return true;
        };

        if (!is_valid(positives)) {
            return;
        }

        const primary_functions: { bitfield: bigint, boolean_function: BooleanFunction }[] = [];
        const first_generation: { bitfield: bigint, indices: number[] } [] = [];
        const range = positives | negatives;
        const seen_bitfield: Set<bigint> = new Set();
        const accepted_indices: Set<string> = new Set();
        
        for (const [bitfield, boolean_function] of [...this.boolean_functions]) {
            if (is_valid(bitfield & positives)) {
                const bitfield_in_range = bitfield & range;

                if (!seen_bitfield.has(bitfield_in_range)) {
                    seen_bitfield.add(bitfield_in_range);
                    if ((bitfield & negatives) === 0n) {
                        yield { bitfield, boolean_function };
                    } else {
                        first_generation.push({bitfield, indices: [primary_functions.length]});
                        accepted_indices.add(primary_functions.length.toString())
                        primary_functions.push({bitfield, boolean_function});
                    }    
                }
            }
        }

        let current_generation = first_generation;

        const is_accepted = (indices: number[]) => {
            for(let i = 0; i < indices.length; i++) {
                if (!accepted_indices.has([...indices.slice(0, i), ...indices.slice(i+1)].map(index => index.toString()).join(','))) {
                    return false;
                }
            }
            return true;
        }

        while (current_generation.length > 0) {
            const next_generation: { bitfield: bigint, indices: number[] }[] = [];
            await this.check_timeout();

            for (const { bitfield: current_bitfield, indices} of current_generation) {
                for (let i = indices[indices.length-1]; i < primary_functions.length; i++) {
                    const { bitfield: primary_bitfield } = primary_functions[i];
                    const bitfield = current_bitfield & primary_bitfield;

                    if (is_valid(bitfield & positives)) {
                        const bitfield_in_range = bitfield & range;
                        const new_indices = [...indices, i];
                        if (!seen_bitfield.has(bitfield_in_range) && is_accepted(new_indices)) {
                            seen_bitfield.add(bitfield_in_range);              
                            if ((bitfield & negatives) === 0n) {
                                yield { bitfield, boolean_function: F.and_v(new_indices.map(index => primary_functions[index].boolean_function)) };
                            } else {
                                next_generation.push({bitfield, indices: new_indices});
                                accepted_indices.add(new_indices.map(index => index.toString()).join(','));
                            }
                        }
                    }
                }
            }

            current_generation = next_generation;
        }
    }

    async select_best_function(f: NumberFunction, output_is_input = false, type: 'color' | 'grid') {

        const values: number[] = [];
        for (const sample of this.samples()) {
            values.push(sample.output(f, output_is_input)!);
        }

        const functions = this.get_functions(type);

        const functions_info: { func: NumberFunction, bitfield: bigint, count: number }[] = []

        for (const func of functions) {
            let bitfield = 0n;
            let count = 0;
            for (let i = 0; i < values.length; i++) {
                if (values[i] >= 0 && values[i] === func.values[i]) {
                    bitfield |= 1n << BigInt(i);
                    count++;
                }
            }
            functions_info.push({ func: func.func, bitfield, count });
        }

        const range_values = new Set(values);

        if (range_values.size < 12) {
            for (const value of range_values) { // negative values means that the output is not considered
                if (value >= 0) {
                    const func: NumberFunction = F.make(`${value}`, value);
                    let bitfield = 0n;
                    let count = 0;
                    for (let i = 0; i < values.length; i++) {
                        if (values[i] === value) {
                            bitfield |= 1n << BigInt(i);
                            count++;
                        }
                    }
                    functions_info.push({ func, bitfield, count });    
                }
            }    
        }

        /*log('finding best function...');
        log({ 
            samples_mask: bitfield_to_string(this.samples_mask),
            functions: functions_info.map(info => { return { bitfield: bitfield_to_string(info.bitfield), function: info.func.path }; }),
            conditions: [...this.boolean_functions].map(key_value => { return { bitfield: bitfield_to_string(key_value[0]), count: count_bits(key_value[0]), function: key_value[1].path }; })
        });*/

        const construct_best_solution = async (bitfield_done: bigint, current_function: F<number>): Promise<{ bitfield: bigint, func: F<number>}> => {
            const bitfield_seen: Set<bigint> = new Set();
            const bitfield_todo = ~bitfield_done & this.samples_mask;

            const updated_function_info = functions_info.map(({ bitfield, func }) => {
                const updated_bitfield = bitfield & bitfield_todo;
                const count = count_bits(updated_bitfield);
                return { func, bitfield: updated_bitfield, count: !bitfield_seen.has(updated_bitfield)? count: 0 };
            }).filter(x => x.count > 0);

            updated_function_info.sort((a, b) => b.count - a.count);

            for (const { bitfield, func } of updated_function_info) {

                const boolean_terms: { bitfield: bigint, boolean_function: BooleanFunction }[] = [];
                    
                for await (const boolean_term of this.enum_valid_boolean_terms(bitfield & bitfield_todo, ~bitfield & bitfield_todo)) {
                    boolean_terms.push(boolean_term)
                }

                await this.check_timeout();

                if (boolean_terms.length > 0) {
                    const boolean_terms_selected: { bitfield: bigint, boolean_function: BooleanFunction, count: number }[] = [];
                    let boolean_terms_left = boolean_terms.map(term => { return { ...term, count: count_bits(term.bitfield) }; })

                    while (boolean_terms_left.length > 0) {
                        boolean_terms_left.sort((a, b) => b.count - a.count);
                        const term_selected = boolean_terms_left[0];
                        boolean_terms_selected.push(term_selected);
                        alert(`selected: ${boolean_terms_selected.length}, left: ${boolean_terms_left.length}, count: ${term_selected.count}, func: ${term_selected.boolean_function.path}`);
                        log(term_selected);
                        boolean_terms_left = boolean_terms_left.map(term => { 
                            const bitfield = term.bitfield & ~term_selected.bitfield;
                            return { bitfield, boolean_function: term.boolean_function, count: count_bits(bitfield)}; 
                        }).filter(term => term.count > 0);
                    }

                    log({ 
                        samples_mask: bitfield_to_string(this.samples_mask),
                        samples_count: this.samples_count,
                        function: { bitfield: bitfield_to_string(bitfield), function: func.path, count: count_bits(bitfield) },
                        conditions: boolean_terms_selected.map(({ bitfield, boolean_function }) => { return { bitfield: bitfield_to_string(bitfield), count: count_bits(bitfield), function: boolean_function.path }; })
                    });
            
                    const updated_func = F.ifthenelse(F.or_v(boolean_terms_selected.map(term => term.boolean_function)), func, current_function);
                    const added_bits = bitfield_or_v(boolean_terms_selected.map(term => term.bitfield));
                    const updated_bitfield_done = bitfield_done | added_bits;
                    
                    if (added_bits > 0n) {
                        return construct_best_solution(updated_bitfield_done, updated_func);
                    }
                }
            }

            return { bitfield: bitfield_done, func: current_function };
        }

        return construct_best_solution(0n, F.make('-1', -1));

    }

    async *enum_mapping_functions(f: NumberFunction, output_is_input = false): AsyncGenerator<NumberFunction> {
        //log('enum_mapping_functions');
        //log(this.generic_functions_output);
        //log([...this.samples()].map(sample => sample.output(f, output_is_input)));

        for (const input_func of this.generic_functions) {
            const mapping: Map<number, number> = new Map();
            let ok = true;
            for (const sample of this.samples()) {
                const input_value = sample.dual_input(input_func)!;
                const output_value = sample.output(f, output_is_input)!;
                if (mapping.has(input_value)) {
                    if (mapping.get(input_value) !== output_value) {
                        ok = false;
                        break;
                    }
                } else {
                    mapping.set(input_value, output_value);
                }
            }

            if (ok && mapping.size < 0.7 * this.samples_count) {
                log(mapping);
                const func = input_func.func.f;
                const result = new F(`{ ${[...mapping].map(kv => kv[0].toString() + ' => ' + kv[1].toString()).join(', ')} }.get(${input_func.func.path})`, (image, ...indices) => mapping.get(func(image, ...indices))!);
                result.path = result.name;
                yield result;
            }
        }
    }

    async select_decision_tree_function(f: NumberFunction, output_is_input = false, type: 'number' | 'color' | 'grid') {
        const values: number[] = [];
        for (const sample of this.samples()) {
            values.push(sample.output(f, output_is_input)!);
        }

        const functions = this.get_functions(type);

        const functions_info: { func: NumberFunction, bitfield: bigint, count: number }[] = []

        for (const func of functions) {
            let bitfield = 0n;
            let count = 0;
            for (let i = 0; i < values.length; i++) {
                if (values[i] === func.values[i]) {
                    bitfield |= 1n << BigInt(i);
                    count++;
                }
            }
            functions_info.push({ func: func.func, bitfield, count });
        }

        const range_values = new Set(values);

        if (range_values.size < 12) {
            for (const value of range_values) {
                const func: NumberFunction = new F(value.toString(), (_image, ..._indices) => value);
                func.path = func.name;
                let bitfield = 0n;
                let count = 0;
                for (let i = 0; i < values.length; i++) {
                    if (values[i] === value) {
                        bitfield |= 1n << BigInt(i);
                        count++;
                    }
                }
                functions_info.push({ func, bitfield, count });
            }    
        }

        functions_info.sort((a, b) => b.count - a.count);


        log('building a decision tree');
        log({ 
            samples_mask: bitfield_to_string(this.samples_mask),
            functions: functions_info.map(info => { return { bitfield: bitfield_to_string(info.bitfield), function: info.func.path }; }),
            conditions: [...this.boolean_functions].map(key_value => { return { bitfield: bitfield_to_string(key_value[0]), count: count_bits(key_value[0]), function: key_value[1].path }; })
        });

        let max_steps = 100;

        const analyse = async (bitfield_covered: bigint, bitfield_range: bigint, f_func: () => Promise<NumberFunction | undefined>, depth = 0): Promise<NumberFunction | undefined> => {
            if (--max_steps < 0) {
                return;
            }
            if (bitfield_covered === bitfield_range) {
                return f_func();
            } else if (depth < 4 && depth < this.samples_count / 2) {
                const new_bitfield_range = bitfield_range & ~bitfield_covered;

                const new_functions_info = functions_info.map(info => {
                    const new_bitfield = info.bitfield & new_bitfield_range;
                    const new_count = count_bits(new_bitfield);
                    return {
                        ...info, new_bitfield, new_count
                    }
                });

                await this.check_timeout();

                new_functions_info.sort((a, b) => b.new_count - a.new_count);

                for (const info of new_functions_info) {
                    const new_func = info.func;
                    const f_condition_func = () => this.select_boolean_function(info.new_bitfield, this.samples_mask & ~info.bitfield);
                    let result_func_calculated = false;
                    let result_func_value: NumberFunction | undefined = undefined;
                    const result_func = await analyse(info.bitfield, new_bitfield_range, async () => {
                        if (!result_func_calculated) {
                            result_func_calculated = true;
                            const condition_func = await f_condition_func();
                            const func = await f_func();
                            if (condition_func && func) {
                                result_func_value = F.ifthenelse(condition_func, new_func, func)
                            }
                        }
                        return result_func_value;
                    }, depth+1);
                    if (result_func) {
                        return result_func;
                    }
                }
            }
        }

        for (let i = 0; i < 4 && i < functions_info.length; i++) {
            const info = functions_info[i]
            const result_func = await analyse(info.bitfield, this.samples_mask, () => Promise.resolve(info.func));
            if (result_func) {
                log(`decision tree built: ${f.path} = ${result_func.path}`);
                return result_func;
            }
        }

        log(`decision true failed for ${f.path}`)
    }

    async select_color_function(f: ColorFunction, output_is_input = false) {
        const key = dual_function_key(this.raise_dual_output_color(f))
        if (this.output_dual_color.has(key)) {
            const value = this.output_dual_color.get(key);
            if (value === 'failed') {
                return;
            } else {
                return value;
            }
        }

        try {
            for await (const color_function of this.enum_color_functions(f, output_is_input)) {
                log(`output.${f.path} = input.${color_function.path}`);
                this.output_dual_color.set(key, color_function);
                return color_function;
            }    
        } catch (e) {
            await this.check_timeout();
            log_error(e);
        }

        this.output_dual_color.set(key, 'failed');
        log(`output.${f.path} cannot be built!`);
    }

    async build_color_function(f: ColorFunction, output_is_input = false) {
        const key = dual_function_key(this.raise_dual_output_color(f))
        if (this.output_dual_color.has(key)) {
            const value = this.output_dual_color.get(key)!;
            if (value === 'failed') {
                throw new CantBuildColorFunction(f);
            } else {
                return value;
            }
        }

        try {
            for await (const color_function of this.enum_color_functions(f, output_is_input)) {
                log(`output.${f.path} = input.${color_function.path}`);
                this.output_dual_color.set(key, color_function);
                return color_function;
            }
        } catch (e) {
            await this.check_timeout();
            log_error(e);
        }

        log(`output.${f.path} cannot be built!`);
        this.output_dual_color.set(key, 'failed');
        throw new CantBuildColorFunction(f);
    }

    async *enum_color_functions(f: ColorFunction, output_is_input = false): AsyncGenerator<ColorFunction> {
        const color = this.first_sample().output(f, output_is_input);
    
        if (!this.options.no_same_check && !output_is_input) {
            try {
                let ok = true;
                for (const sample of this.samples()) {
                    if (sample.output(f, output_is_input) !== sample.input(f)) {
                        ok = false;
                        break;
                    }
                }
                if (ok) {
                    yield f;
                }    
                
            } catch (_e) {
                //
            }    
        }
    
        let ok = true;
        for (const sample of this.samples()) {
            if (sample.output(f, output_is_input) !== color) {
                ok = false;
                break;
            }
        }
        if (ok) {
            yield F.make(Color[color], color);
        }
    
        for (const color_function of this.color_functions) {
            let ok = true;
    
            for (const sample of this.samples()) {
                if (sample.dual_input(color_function)! !== sample.output(f, output_is_input)!) {
                    ok = false;
                    break;
                }
            }
        
            if (ok) {
                yield color_function.func;
            }
        }

        const values = this.output_first_level(f as NumberFunction, output_is_input);
    
        if (values) {
            for (let i = 0; i < this.sub_images_table_analysis.length; i++) {
                const table_analysis = this.sub_images_table_analysis[i];
                for await (const func of table_analysis.enum_functions('color', values)) {
                    yield func;
                }
            }
        }

        if (!this.options.no_decision_tree) {
            const decision_tree_func = await this.select_decision_tree_function(f, output_is_input, 'color');

            if (decision_tree_func) {
                yield decision_tree_func;
            }
        }
    
        if (!this.options.no_mapping) {
            for await (const mapping_function of this.enum_mapping_functions(f, output_is_input)) {
                yield mapping_function;
            }    
        }

        log({ values, color_functions: this.color_functions });

        log_error(f);
    }
    
    async select_number_function(f: NumberFunction, output_is_input = false) {

        const key = dual_function_key(this.raise_dual_output_number(f))
        if (this.output_dual_number.has(key)) {
            const value = this.output_dual_number.get(key);
            if (value === 'failed') {
                return;
            } else {
                return value;
            }
        }

        try {
            for await (const number_function of this.enum_number_functions(f, output_is_input)) {
                log(`output.${f.path} = input.${number_function.path}`);
                this.output_dual_number.set(key, number_function);
                return number_function;
            }    
        } catch (e) {
            await this.check_timeout();
            log_error(e);
        }

        this.output_dual_number.set(key, 'failed');
        log(`output.${f.path} cannot be built!`);
    }

    async build_number_function(f: NumberFunction, output_is_input = false) {

        const key = dual_function_key(this.raise_dual_output_number(f))
        if (this.output_dual_number.has(key)) {
            const value = this.output_dual_number.get(key)!;
            if (value === 'failed') {
                throw new CantBuildNumberFunction(f);
            } else {
                return value;
            }
        }

        try {
            for await (const number_function of this.enum_number_functions(f, output_is_input)) {
                log(`output.${f.path} = input.${number_function.path}`);
                this.output_dual_number.set(key, number_function);
                return number_function;
            }    
        } catch (e) {
            await this.check_timeout();
            log_error(e);
        }

        this.output_dual_number.set(key, 'failed');
        log(`output.${f.path} cannot be built!`);
        throw new CantBuildNumberFunction(f);
    }

    async *enum_number_functions(f: NumberFunction, output_is_input = false): AsyncGenerator<NumberFunction> {
        const n = this.first_sample().output(f, output_is_input);

        if (!this.options.no_same_check && !output_is_input) {
            try {
                let ok = true;
                for (const sample of this.samples()) {
                    if (sample.output(f, output_is_input) !== sample.input(f)) {
                        ok = false;
                        break;
                    }
                }
                if (ok) {
                    yield f;
                }    
                
            } catch (_e) {
                //
            }    
        }
    
        {
            let ok = true;
            for (const sample of this.samples()) {
                if (sample.output(f, output_is_input) !== n) {
                    ok = false;
                    break;
                }
            }
            if (ok) {
                yield F.make(n.toString(), n);
            }    
        }
    
        for (const number_function of this.number_functions) {
            const first_sample = this.first_sample();
            const first_value = first_sample.output(f, output_is_input)!;
            const first_number_function_value = first_sample.dual_input(number_function)!;
            const delta =  first_value - first_number_function_value;
            const scale =  first_value / first_number_function_value;
            let ok_delta = true;
            let ok_scale = true;
    
            for (const sample of this.samples()) {
                const value = sample.output(f, output_is_input)!;
                const number_function_value = sample.dual_input(number_function)!;
                if (ok_delta && number_function_value + delta !== value) {
                    ok_delta = false;
                }
                if (ok_scale && number_function_value * scale !== value) {
                    ok_scale = false;
                }
                if (!ok_delta && !ok_scale) {
                    break;
                }
            }
        
            if (ok_delta) {
                yield F.plus(number_function.func, delta);
            }
            if (ok_scale) {
                yield F.times(number_function.func, scale);
            }
        }

        const values = this.output_first_level(f, output_is_input);
    
        if (values) {
            for (let i = 0; i < this.sub_images_table_analysis.length; i++) {
                const table_analysis = this.sub_images_table_analysis[i];
                for await (const func of table_analysis.enum_functions('number', values)) {
                    yield func;
                }
            }
        }

        if (!this.options.no_decision_tree) {
            const decision_tree_func = await this.select_decision_tree_function(f, output_is_input, 'number');

            if (decision_tree_func) {
                yield decision_tree_func;
            }
    
        }
    
        if (!this.options.no_mapping) {
            for await (const mapping_function of this.enum_mapping_functions(f, output_is_input)) {
                yield mapping_function;
            }    
        }

        log({ values, functions: this.number_functions })
        log_error(f);
    }
    
    async select_grid_function(f: GridFunction, output_is_input = false) {
        const key = dual_function_key(this.raise_dual_output_grid(f))
        if (this.output_dual_grid.has(key)) {
            const value = this.output_dual_grid.get(key);
            if (value === 'failed') {
                return;
            } else {
                return value;
            }
        }

        try {
            for await (const grid_function of this.enum_grid_functions(f, output_is_input)) {
                log(`output.${f.path} = input.${grid_function.path}`);
                this.output_dual_grid.set(key, grid_function);
                return grid_function;
            }    
        } catch (e) {
            await this.check_timeout();
            log_error(e);
        }

        log(`output.${f.path} cannot be built!`);
        this.output_dual_grid.set(key, 'failed');
    }

    async build_grid_function(f: GridFunction, output_is_input = false) {
        const key = dual_function_key(this.raise_dual_output_grid(f))
        if (this.output_dual_grid.has(key)) {
            const value = this.output_dual_grid.get(key)!;
            if (value === 'failed') {
                throw new CantBuildGridFunction(f);
            } else {
                return value;
            }
        }

        try {
            for await (const grid_function of this.enum_grid_functions(f, output_is_input)) {
                log(`output.${f.path} = input.${grid_function.path}`);
                this.output_dual_grid.set(key, grid_function);
                return grid_function;
            }
        } catch (e) {
            await this.check_timeout();
            log_error(e);
        }

        log(`output.${f.path} cannot be built!`);

        this.output_dual_grid.set(key, 'failed');
        throw new CantBuildGridFunction(f);
    }

    async *enum_grid_functions(f: GridFunction, output_is_input = false): AsyncGenerator<GridFunction> {
        const grid = this.first_sample().output(f, output_is_input);

        log('enum_grid_function');
    
        if (!this.options.no_same_check && !output_is_input) {
            try {
                let ok = true;
                for (const sample of this.samples()) {
                    if (!sample.output(f, output_is_input).equals(sample.input(f))) {
                        ok = false;
                        break;
                    }
                }
                if (ok) {
                    yield f;
                }    
                
            } catch (_e) {
                //
            }    
        }
    
        if (grid)
        {
            let ok = true;
            for (const sample of this.samples()) {
                const output_grid = sample.output(f, output_is_input);
    
                if (!output_grid || !output_grid.equals(grid)) {
                    ok = false;
                    break;
                }
            }
            if (ok) {
                yield F.make('grid#', grid);
            }    
        }
    
        if (grid) {
            log('there is a grid');
            log(this.grid_number_functions);
            const transforms = [
                Transform.flip_x,
                Transform.flip_y,
                Transform.rotate_90,
                Transform.rotate_180,
                Transform.rotate_270,
                Transform.transpose,
                Transform.opposite_transpose,
            ];
            for (const grid_number_function of this.grid_number_functions) {
                let ok = true;
                log('grid_function');
                const transforms_ok = transforms.map(_ => true);
        
                for (const sample of this.samples()) {
                    const input_grid = this.grids[sample.dual_input(grid_number_function)];
                    const output_grid = sample.output(f, output_is_input);
                    if (!input_grid || !output_grid) {
                        log('grid_function !ok');
                        ok = false;
                        transforms_ok.fill(false);
                        break;
                    } else {
                        if (ok && !input_grid.equals(output_grid)) {
                            log("input grid !== output grid");
                            ok = false;
                        }
                        for (let t = 0; t < transforms.length; t++) {
                            if (transforms_ok[t] && !new ImageTransformation(transforms[t], basic_grid(input_grid)).to_grid().equals(output_grid)) {
                                transforms_ok[t] = false;
                            }    
                        }
                    }
                }

                const grid_function = this.raise_grid_function(grid_number_function.func);
            
                if (ok) {
                    log('grid_function ok');
                    yield grid_function;
                }

                for (let t = 0; t < transforms.length; t++) {
                    if (transforms_ok[t]) {
                        const func = grid_function.f;
                        const tr = transforms[t];
                        const result = new F(`transform(${grid_function.name})`, (image, ...indices) => new ImageTransformation(tr, basic_grid(func(image, ...indices)!)).to_grid())
                        result.path = `new ImageTransformation(${Transform[tr]}, basic_grid(${grid_function.path})).to_grid()`;
                        yield result;
                    }    
                }
            }   
        }
    
        for (let i = 0; i < this.sub_images_functions.length; i++) {
            const sub_images_function = this.sub_images_functions[i];
            const grid_number_functions = this.sub_images_grid_number_functions[i];
    
            for (const grid_number_function of grid_number_functions) {
                const grid_function = this.raise_grid_function(grid_number_function)
                let and_ok = true;
                let xor_ok = true;
                let free_ok = true;
                let perm_ok = true;
                let complement_free_ok = true;
                let permutations: Set<number[]> = new Set();
    
                for (const sample of this.samples()) {
                    const input_grids = sample.input(sub_images_function)?.map(sub_image => grid_function.f(sub_image));
                    const output_grid = sample.output(f, output_is_input);
                    if (input_grids && output_grid) {
                        if (and_ok && !new SubImages(input_grids.map(input_grid => basic_grid(input_grid!)), 'and').to_grid().equals(output_grid)) {
                            and_ok = false;
                        }
                        if (xor_ok && !new SubImages(input_grids.map(input_grid => basic_grid(input_grid!)), 'xor').to_grid().equals(output_grid)) {
                            xor_ok = false;
                        }
                        if (free_ok && !new SubImages(input_grids.map(input_grid => basic_grid(input_grid!)), 'free').to_grid().equals(output_grid)) {
                            free_ok = false;
                        }
                        if (perm_ok) {
                            if (input_grids.length > 4) {
                                perm_ok = false;
                            } else {
                                if (permutations.size === 0) {
                                    permutations = make_permutation_set(input_grids.length);
                                }

                                for (const permutation of permutations) {
                                    if (permutation.length !== input_grids.length) {
                                        perm_ok = false;
                                        break;
                                    }
                                    if (!new SubImages(permutation.map(index => basic_grid(input_grids[index]!)), 'free').to_grid().equals(output_grid)) {
                                        permutations.delete(permutation);
                                    }
                                }

                                if (permutations.size === 0) {
                                    perm_ok = false;
                                }
                            }
                        }
                        if (complement_free_ok && !new BackgroundColor(Color.true, new SubImages(input_grids.map(input_grid => basic_grid(input_grid!)), 'free')).to_grid().equals(output_grid)) {
                            complement_free_ok = false;
                        }
                    } else {
                        and_ok = xor_ok = free_ok = complement_free_ok = perm_ok = false;
                        break;
                    }
                }
            
                if (and_ok || xor_ok || free_ok) {
                    const operator = and_ok? 'and' : xor_ok? 'xor': 'free';
                    const result = new F('SubImages', (image, ...indices) => {
                        const input_grids = sub_images_function.f(image, ...indices)?.map(sub_image => grid_function.f(sub_image))!;
                        return new SubImages(input_grids.map(input_grid => basic_grid(input_grid!)), operator).to_grid();
                    });
                    result.path = `new SubImages(${sub_images_function.path}[*].${grid_function.path}, '${operator}')`;
                    yield result;
                }
                if (perm_ok) {
                    const permutation = [...permutations][0];
                    const result = new F('SubImages', (image, ...indices) => {
                        const input_grids = sub_images_function.f(image, ...indices)?.map(sub_image => grid_function.f(sub_image))!;
                        return new SubImages(permutation.map(index => basic_grid(input_grids[index]!)), 'free').to_grid();
                    });
                    result.path = `new SubImages(${sub_images_function.path}${permutation}.${grid_function.path}, 'free')`;
                    yield result;
                }    
                if (complement_free_ok) {
                    const result = new F('BackgroundColor', (image, ...indices) => {
                        const input_grids = sub_images_function.f(image, ...indices)?.map(sub_image => grid_function.f(sub_image))!;
                        return new BackgroundColor(Color.true, new SubImages(input_grids.map(input_grid => basic_grid(input_grid!)), 'free')).to_grid();
                    });
                    result.path = `new BackgroundColor(Color.true, new SubImages(${sub_images_function.path}[*].${grid_function.path}, 'free'));
`;
                    yield result;
                }    
            }
        }

        const f_index = this.raise_grid_number_function(f);
        
        const values = this.output_first_level(f_index, output_is_input);
    
        if (values) {
            for (let i = 0; i < this.sub_images_table_analysis.length; i++) {
                const table_analysis = this.sub_images_table_analysis[i];
                for await (const func of table_analysis.enum_functions('grid', values)) {
                    yield this.raise_grid_function(func);
                }
            }
        }

 
        if (!this.options.no_decision_tree) {
            const decision_tree_func = await this.select_decision_tree_function(f_index, output_is_input, 'grid');

            if (decision_tree_func) {
                yield this.raise_grid_function(decision_tree_func);
            }    
        }

        if (!this.options.no_mapping) {
            for await (const mapping_function of this.enum_mapping_functions(f_index, output_is_input)) {
                log("mapping_function found for grid");
                yield this.raise_grid_function(mapping_function);
            }                
        }

        log({ values, functions: this.grid_number_functions })

        log_error(f);
    }    
}

