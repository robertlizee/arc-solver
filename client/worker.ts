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

import { WorkerLoop } from "./WorkerLoop";
const worker_loop = new WorkerLoop();
import { solve_puzzle_trying_all_decomposers, solve_puzzle } from "../lib/UsingSolver";
import { Decomposer } from "../lib/DecomposersData";
import { set_logging } from "../lib/Logger";
import { ArcPuzzle } from "../lib/ArcPuzzle";

set_logging(false);

async function worker_handle_message(message: 
    { task: 'solve_puzzle', puzzle: ArcPuzzle }
    | { task: 'solve_puzzle_trying_all_decomposers', puzzle: ArcPuzzle, decomposers: { decomposer_input: Decomposer, decomposer_output: Decomposer}[] }
    )
{
    console.log('received message from main', message);
    switch (message.task) {
        case 'solve_puzzle':
            await solve_puzzle(message.puzzle);
            return message.puzzle;
        case 'solve_puzzle_trying_all_decomposers':
            await solve_puzzle_trying_all_decomposers(message.puzzle, message.decomposers);
            return message.puzzle;
    }
}


(async () => {
    // deno-lint-ignore no-explicit-any
    worker_loop.start(worker_handle_message as any);
  })();
