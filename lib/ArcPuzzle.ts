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

import { Decomposer } from "../lib/DecomposersData";

export interface ArcSample {
    input: number[][];
    output: number[][];
    solution?: number[][];
}

export interface ArcPuzzle {
    name?: string;
    program_name?: string;
    program?: string;
    program_transpiled?: string;
    state?: 'solved' | 'half-solved' | 'failed' | 'old' | 'invalid' | 'bug' | 'marked';
    last_puzzle?: boolean;
    type: number;
    test: ArcSample[];
    train: ArcSample[];
    index?: number;
    decomposer_input?: Decomposer
    decomposer_output?: Decomposer
}

export interface ArkSolution {
    task_name: string;
    test: {
        output_id: number;
        number_of_predictions: number;
        predictions: {
            prediction_id: number;
            output: number[][];
        }[];
    }[];
}




export function is_solution(sample: ArcSample) {
    if (sample.solution && sample.output.length === sample.solution.length && sample.output[0].length === sample.solution[0].length) {
        for (let j = 0; j < sample.output.length; j++) {
            const output_row = sample.output[j];
            const solution_row = sample.solution[j];
            for (let i = 0; i < output_row.length; i++) {
                if (output_row[i] !== solution_row[i]) {
                    return false;
                }
            }
        }
        return true;
    } else {
        return false;
    }
}

