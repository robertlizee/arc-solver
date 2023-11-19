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

import { log, log_error } from "./Logger";
import { all, append_vectors, range, set_intersection, set_intersection_equal } from "./Misc";
import { BooleanFunction, DualFunction, F, ImageFunction, NumberFunction, Solver } from "./Solver";
import { SymbolicImage } from "./SymbolicImage";

function number_null_to_string(x: number | null) {
    return x !== null? x.toString() : 'null';
}

function count_array<X>(array: (X | null)[]): (number|null)[] {
    const count_map: Map<X, number> = new Map();

    for (const elem of array) {
        if (elem === null) {
            //
        } else if (count_map.has(elem)) {
            count_map.set(elem, count_map.get(elem)! + 1)
        } else {
            count_map.set(elem, 1);
        }
    }

    return array.map(elem => elem !== null? count_map.get(elem)!: null);

}

function count_arrays(arrays: (number | null)[][]): (number | null)[] {

    if (arrays.length === 1) {
        return count_array(arrays[0]);
    } else {
        const array: (string | null)[] = [];

        for (let i = 0; i < arrays[0].length; i++) {
            if (arrays[0][i] === null) {
                array.push(null)
            } else {
                array.push(arrays.map(a => a[i]!.toString()).join(','));
            }
        }
    
        return count_array(array);    
    }
}

function rank_array(array: (number | null)[]): (number | null)[] {
    const elems = [...new Set(array.filter(x => x !== null))] as number[];
    elems.sort((a, b) => a - b);
    const rank_map: Map<number, number> = new Map();
    for (let i = 0; i < elems.length; i++) {
        rank_map.set(elems[i], i);
    }

    return array.map(elem => elem !== null? rank_map.get(elem)! : null)
}

function inv_rank_array(array: (number | null)[]): (number | null)[] {
    const elems = [...new Set(array.filter(x => x !== null))] as number[];
    elems.sort((a, b) => a - b);
    const inv_rank_map: Map<number, number> = new Map();
    for (let i = 0; i < elems.length; i++) {
        inv_rank_map.set(elems[i], elems.length - i - 1);
    }

    return array.map(elem => elem !== null? inv_rank_map.get(elem)! : null)
}

function arrays_same_value(arrays: (number | null)[][]): boolean {
    let first_time = true;
    let value = 0;

    for (const array of arrays) {
        for (const elem of array) {
            if (elem !== null) {
                if (first_time) {
                    value = elem;
                    first_time = false;
                } else if (value !== elem) {
                    return false;
                }    
            }
        }
    }

    return true;
}

interface ColumnDescription {
    indices: number[];
    count: boolean;
    rank: boolean;
    inv_rank: boolean;
    type: 'number' | 'color' | 'grid';
}

export class TableAnalysis {

    columns_desc: ColumnDescription[] = [];

    columns_samples: (number | null)[][][] = [];
    columns_map: Map<number, number> = new Map();

    constructor(private solver: Solver, private mapping: BooleanFunction | undefined, private length_function: NumberFunction, private index_function: NumberFunction, 
        private generic_functions: NumberFunction[]
    ) {
    }

    static async make(solver: Solver, mapping: BooleanFunction | undefined, length_function: NumberFunction, index_function: NumberFunction, 
        generic_functions: NumberFunction[], counts: number[]
    ) {
        const result = new TableAnalysis(solver, mapping, length_function, index_function, generic_functions);
        result.init(counts);
        return result;
    }
    
    async init([number_count, color_count, _grid_count]: number[]
    ) {

        const samples_values_seen: Set<string> = new Set();
        const samples_values_key = (samples_values: (number | null)[][]) => samples_values.map(values => `[${values.map(v => v === null? 'null' : v.toString()).join(',')}]`).join(',');
        for (let i = 0; i < this.generic_functions.length; i++) {
            const generic_function = this.generic_functions[i];
            const samples_values: number[][] = [];
            let index = 0;
            for (const sample of this.solver.samples()) {
                const sample_values: number[] = [];
                const size = sample.input(this.length_function)!;
                for (let j = 0; j < size; j++) {
                    if (sample.test_mapping(this.mapping, j)) {
                        index++;
                        const value = sample.raise(index, index, j, j).input(generic_function)!;
    
                        sample_values.push(value);    
                    }
                }
                samples_values.push(sample_values);
            }
            if (!arrays_same_value(samples_values)) {
                const key = samples_values_key(samples_values);
                if (!samples_values_seen.has(key)) {
                    samples_values_seen.add(key);
                    this.columns_map.set(i, this.columns_desc.length);
                    this.columns_desc.push({ indices: [i], count: false, rank: false, inv_rank: false, type: i < number_count? 'number' : i < number_count + color_count? 'color' : 'grid'});
                    this.columns_samples.push(samples_values);    
                }
            }
        }
        const basic_columns_end = this.columns_desc.length;
        log(`basic_columns_end = ${basic_columns_end}`);
        const one_columns_count_considered: number[] = [];
        const count_samples_values_seen: Set<string> = new Set();

        for (let i = 0; i < basic_columns_end; i++) {
            const samples_values = this.columns_samples[i].map(count_array);
            if (!arrays_same_value(samples_values)) {
                const key = samples_values_key(samples_values);
                if (!count_samples_values_seen.has(key)) {
                    count_samples_values_seen.add(key);
                    one_columns_count_considered.push(i);
                    this.columns_desc.push({ ...this.columns_desc[i], count: true, type: 'number' });
                    this.columns_samples.push(samples_values);
                }
            }
        }

        let current_counts = one_columns_count_considered.map(i => [i]);
        let depth = 4;

        while (current_counts.length > 0 && depth-- > 0) {
            const next_counts: number[][] = [];

            for (const base_columns_index of current_counts) {
                for (let i = base_columns_index[base_columns_index.length-1]; i < basic_columns_end; i++) {
                    const columns_index = [...base_columns_index, i];
                    const columns_samples_values = columns_index.map(index => this.columns_samples[index]);
                    const samples_values = columns_samples_values[0].map((_, index) => count_arrays(columns_samples_values.map(samples_values => samples_values[index])));

                    if (!arrays_same_value(samples_values)) {
                        const key = samples_values_key(samples_values);
                        if (!count_samples_values_seen.has(key)) {
                            count_samples_values_seen.add(key);
                            next_counts.push(columns_index);
                            this.columns_desc.push({ indices: columns_index.map(index => this.columns_desc[index].indices[0]), count: true, rank: false, inv_rank: false, type: 'number' });
                            this.columns_samples.push(samples_values);
                        }
                    }
                }
            }

            current_counts = next_counts;
        }

        const count_columns_end = this.columns_desc.length;
        const rank_samples_values_seen: Set<string> = new Set();

        for (let i = 0; i < count_columns_end; i++) {
            if (this.columns_desc[i].count) {
                const samples_values = this.columns_samples[i];
                const rank_samples_values = samples_values.map(rank_array);
                const rank_samples_values_key = samples_values_key(rank_samples_values);
                if (!rank_samples_values_seen.has(rank_samples_values_key)) {
                    rank_samples_values_seen.add(rank_samples_values_key);
                    this.columns_desc.push({...this.columns_desc[i], rank: true, type: 'number' });
                    this.columns_samples.push(rank_samples_values);
                }
                const inv_rank_samples_values = samples_values.map(inv_rank_array);
                const inv_rank_samples_values_key = samples_values_key(inv_rank_samples_values);
                if (!rank_samples_values_seen.has(inv_rank_samples_values_key)) {
                    rank_samples_values_seen.add(inv_rank_samples_values_key);
                    this.columns_desc.push({...this.columns_desc[i], inv_rank: true, type: 'number' });
                    this.columns_samples.push(inv_rank_samples_values);
                }    
            }
        }
        for (let i = 0; i < count_columns_end; i++) {
            if (!this.columns_desc[i].count && this.columns_desc[i].type === 'number') {
                const samples_values = this.columns_samples[i];
                const rank_samples_values = samples_values.map(rank_array);
                const rank_samples_values_key = samples_values_key(rank_samples_values);
                if (!rank_samples_values_seen.has(rank_samples_values_key)) {
                    rank_samples_values_seen.add(rank_samples_values_key);
                    this.columns_desc.push({...this.columns_desc[i], rank: true, type: 'number' });
                    this.columns_samples.push(rank_samples_values);
                }
                const inv_rank_samples_values = samples_values.map(inv_rank_array);
                const inv_rank_samples_values_key = samples_values_key(inv_rank_samples_values);
                if (!rank_samples_values_seen.has(inv_rank_samples_values_key)) {
                    rank_samples_values_seen.add(inv_rank_samples_values_key);
                    this.columns_desc.push({...this.columns_desc[i], inv_rank: true, type: 'number' });
                    this.columns_samples.push(inv_rank_samples_values);
                }    
            }
        }

        log(`done init table analyser`);
    }

    async *enum_functions(type: 'number' | 'color' | 'grid', values: number[]): AsyncGenerator<NumberFunction> {

        const check_timeout = async () => {
            await this.solver.check_timeout();
        }

        if (type === 'number') {
            for (let output_index = 0; output_index < this.columns_desc.length; output_index++) {
                const output_desc = this.columns_desc[output_index];
                const output_column = this.columns_samples[output_index];

                if (output_desc.type === 'number' && (output_desc.count || output_desc.rank || output_desc.inv_rank)) {
                    const input_columns = output_desc.indices.map(index => this.columns_samples[this.columns_map.get(index)!]);
                    const output_indices = values.map((value, j) => output_column[j].map((v, k) => v === value? k : -1).filter( x => x >= 0));
                    let ok = true;
                    for (const indices of output_indices) {
                        if (indices.length === 0) {
                            ok = false;
                            break;
                        }
                    }
                    if (ok) {
                        const input_values = set_intersection(...output_indices.map((indices, i) => new Set(
                                indices.map(index => input_columns.map(input_column => number_null_to_string(input_column[i][index])).join(',')))
                        ));

                        if (input_values.size > 0) {
                            const inputs = (input_values.values().next().value as string).split(',').map(str => parseInt(str));
                            yield this.build_function(inputs, output_desc.indices.map(index => this.columns_desc[this.columns_map.get(index)!]), output_desc);
                        }
                    }
                }
            }
        }
        log(`TableAnalysis.enum_functions('${type}')`)
        for (let output_index = 0; output_index < this.columns_desc.length; output_index++) {
            const output_desc = this.columns_desc[output_index];
            const output_column = this.columns_samples[output_index];

            if (output_desc.type === type) {
                const output_indices = values.map((value, j) => output_column[j].map((v, k) => v === value? k : -1).filter( x => x >= 0));

                log({ values, output_column });

                if (!all(output_indices, a => a.length > 0)) {
                    continue;
                }

                //log('valid output indices');

                const potential_input_info: { value: number | null, column_desc: ColumnDescription, column: (number | null)[][] }[] = [];

                for (let input_index = 0; input_index < this.columns_desc.length; input_index++) {
                    await check_timeout();
                    if (input_index !== output_index) {
                        const input_desc = this.columns_desc[input_index];
                        const input_column = this.columns_samples[input_index];

                        const input_values = new Set(input_column[0]);

                        for (let j = 0; input_values.size > 0 && j < input_column.length; j++) {
                            const new_values = new Set(output_indices[j].map(k => input_column[j][k]));
                            set_intersection_equal(input_values, new_values);
                        }

                        for (const value of input_values) {
                            potential_input_info.push({ value, column_desc: input_desc, column: input_column });
                        }
                    }
                }

                potential_input_info.sort((a, b) => a.value! - b.value!)

                const potential_input_values = potential_input_info.map(x => x.value);
                const potential_input_columns_desc = potential_input_info.map(x => x.column_desc);
                const potential_input_columns = potential_input_info.map(x => x.column);

                const test_potential_inputs = (indices: number[]): 'invalid' | 'complete' | 'incomplete' => {
                    let incomplete = false;

                    for (let sample_index = 0; sample_index < values.length; sample_index++) {
                        const output_column_i = output_column[sample_index];
                        const output_values: Set<number> = new Set();

                        for (let row_index = 0; row_index < output_column_i.length; row_index++) {
                            let row_match = true;
                            for (const index of indices) {
                                if (potential_input_columns[index][sample_index][row_index] !== potential_input_values[index]) {
                                    row_match = false;
                                }
                            }
                            if (row_match && output_column_i[row_index] !== null) {
                                output_values.add(output_column_i[row_index]!)
                            }
                        }
                        if (!output_values.has(values[sample_index])) {
                            return 'invalid';
                        }
                        if (output_values.size > 1) {
                            incomplete = true;
                        }
                    }

                    return incomplete? 'incomplete' : 'complete';
                }
            
                const incomplete_potential_input_indices: number[] = [];
                const incomplete_potential_input_index_sequences: Set<string> = new Set();
                const key_of_array = (array: number[]) => array.map(n => n.toString()).join(',');
                let current_incomplete_potential_input_index_sequences: number[][] = [];

                for (let i = 0; i < potential_input_values.length; i++) {
                    switch (test_potential_inputs([i])) {
                        case 'complete':
                            log('complete');
                            yield this.build_function([potential_input_values[i]!], [potential_input_columns_desc[i]], output_desc);
                            break;
                        case 'incomplete':
                            log('incomplete');
                            await check_timeout();
                            incomplete_potential_input_indices.push(i);
                            incomplete_potential_input_index_sequences.add(i.toString());
                            current_incomplete_potential_input_index_sequences.push([i]);
                            break;
                        case 'invalid':
                            log_error("unexpected program error");
                            break;
                    }
                }

                let max_count = 10000;

                while (current_incomplete_potential_input_index_sequences.length > 0) {
                    const next_incomplete_potential_input_index_sequences: number[][] = [];

                    for (const input_index_sequence of current_incomplete_potential_input_index_sequences) {
                        const last_index = input_index_sequence[input_index_sequence.length - 1];
                        for (const index of incomplete_potential_input_indices) {
                            if (index > last_index) {
                                const next_input_index_sequence = [...input_index_sequence, index];
                                let ok = true;
                                for (let i = 0; ok && i < next_input_index_sequence.length; i++) {
                                    if (!incomplete_potential_input_index_sequences.has(key_of_array([...next_input_index_sequence.slice(0, i), ...next_input_index_sequence.slice(i+1)]))) {
                                        ok = false;
                                    }
                                }
                                if (ok) {
                                    if (max_count-- > 500) {
                                        throw new Error('Table analysis failed!');
                                    }
                                    switch(test_potential_inputs(next_input_index_sequence)) {
                                        case 'complete':
                                            log('complete2');
                                            yield this.build_function(next_input_index_sequence.map(i => potential_input_values[i]!), next_input_index_sequence.map(i => potential_input_columns_desc[i]), output_desc);
                                            //this.solver.mark();
                                            break;
                                        case 'incomplete':
                                            log('incomplete2');
                                            await check_timeout();
                                            incomplete_potential_input_index_sequences.add(key_of_array(next_input_index_sequence));
                                            next_incomplete_potential_input_index_sequences.push(next_input_index_sequence);
                                            break;
                                        case 'invalid':
                                            break;
                                    }
                                }
                            }
                        }
                    }

                    current_incomplete_potential_input_index_sequences = next_incomplete_potential_input_index_sequences;
                }
    
            }
        }
    }

    build_function(inputs: (NumberFunction | number | 'min' | 'max' | 'index')[], inputs_desc: ColumnDescription[], output_desc: ColumnDescription): NumberFunction {
        const length_function = this.length_function;
        const index_function = this.index_function;
        const generation = this.solver.generation;
        const generic_functions: NumberFunction[] = [];
        const mapping = this.mapping;

        for (const desc of [...inputs_desc, output_desc]) {
            for (const index of desc.indices) {
                generic_functions[index] = this.generic_functions[index];
            }
        }

        const compute_source = () => {
    
            const current_index = `i${generation}`;

            const column_at = (index: number) => {
                return `column(${current_index}, ${generic_functions[index].path})`;
            }

            const get_column = (desc: ColumnDescription) => {
        
                const columns = desc.indices.map(column_at);
        
                const column = desc.count? `count_array(${columns.join(',')})`: columns[0];
        
                return desc.rank? `rank_array(${column})`: desc.inv_rank? `inv_rank_array(${column})`: column;
            }

            const input_values = inputs.map(f => typeof(f) === 'number'? f.toString() : f === 'min'? '__min__' : f === 'max'? '__max__' : f === 'index'? '__index__' : f.path);
            const input_columns = inputs_desc.map(get_column);
            const output_column = get_column(output_desc);

            let index = "";

            for (let i = 0; i < input_values.length; i++) {
                const column = index? `${input_columns[i]}[${index}]` : `${input_columns[i]}`
                switch (input_values[i]) {
                    case '__index__': 
                        index = current_index;
                        break;
                    case '__min__':
                        index = `min_index(${column})`;
                        break;
                    case '__max__':
                        index = `max_index(${column})`;
                        break;
                    default:
                        index = `find_index(${column}, ${input_values[i]})`;
                    }
            }

            return `${output_column}[${index}]`;
        }

        const func = (image: SymbolicImage, ...indices: number[]) => {
            const column_at = (index: number) => {
                const f = generic_functions[index];
                const size = length_function.f(image, ...indices)!;
                const result: (number | null)[] = [];
    
                if (mapping) {
                    for (let i = 0; i < size; i++) {
                        const new_indices = [...indices.slice(0, generation), i];
                        if (mapping.f(image, ...new_indices)) {
                            result.push(f.f(image, ...new_indices)!);
                        } else {
                            result.push(null);
                        }
                    }    
                } else {
                    for (let i = 0; i < size; i++) {
                        result.push(f.f(image, ...[...indices.slice(0, generation), i])!);
                    }    
                }
    
                return result;
            }

            const get_column = (desc: ColumnDescription) => {
        
                const columns = desc.indices.map(column_at);
        
                const column = desc.count? count_arrays(columns): columns[0];
        
                return desc.rank? rank_array(column): desc.inv_rank? inv_rank_array(column): column;
            }

            const input_values = inputs.map(f => typeof(f) === 'number'? f : f === 'min'? 'min' : f === 'max'? 'max' : f === 'index'? 'index' : f.f(image, ...indices)!);
            const input_columns = inputs_desc.map(get_column);
            const output_column = get_column(output_desc);

            const current_index = index_function.f(image, ...indices);

            let current_indices = [...range(output_column.length)];

            for (let i = 0; i < input_values.length; i++) {
                const value = input_values[i];

                if (value === 'index') {
                    current_indices = current_indices.filter(index => index === current_index);
                } else {
                    const number_value = value === 'min'? Math.min(...current_indices.map(index => input_columns[i][index] === null? Infinity : input_columns[i][index]!)):
                    value === 'max'? Math.max(...current_indices.map(index => input_columns[i][index] === null? -Infinity : input_columns[i][index]!)):
                    value;

                    current_indices = current_indices.filter(index => number_value === input_columns[i][index]);
                }
            }

            return output_column[current_indices[0]];
       };

       const result = new F(compute_source(), func as ImageFunction<SymbolicImage, number>);
       result.path = result.name;
       return result;
    }

    build_index_dual_function(output_desc: ColumnDescription, values: number[]): DualFunction {
        return {
            type: 'number',
            generation: this.solver.generation + 1,
            func: this.build_function(['index'], [output_desc], output_desc),
            values
        }
    }

    get_extended_number_functions(): DualFunction[] {
        const result: DualFunction[] = [];

        for (let i = 0; i < this.columns_desc.length; i++) {
            const column_desc = this.columns_desc[i];
            const column_samples = this.columns_samples[i];

            if ((column_desc.rank || column_desc.inv_rank) && column_desc.indices.length === 1) {
                result.push(this.build_index_dual_function(column_desc, append_vectors(...column_samples as number[][])))
            }
        }

        return result;
    }
}