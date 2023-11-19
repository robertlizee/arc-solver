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

import { ArcPuzzle, ArcSample } from "../lib/ArcPuzzle";
import { Canvas } from "./Element";

const colors = [
    "#000", /* black */
    "#0074D9", /* blue */
    "#FF4136", /* red */
    "#2ECC40", /* green */
    "#FFDC00", /* yellow */
    "#AAAAAA", /* grey */
    "#F012BE", /* fuschia */
    "#FF851B", /* orange */
    "#7FDBFF", /* teal */
    "#870C25", /* brown */
];
  

export function make_puzzle_canvas(base_size: number, small_space: number, big_space: number, border: number, puzzle: ArcPuzzle) {

    const canvas = new Canvas();

    const all_samples = [...puzzle.train, ...puzzle.test];

    //canvas.element.width = 4 * base_size + 2 * small_space + big_space + 2 * border;
    //canvas.element.height = 2 * base_size + big_space + 2 * border;

    canvas.element.width = 3 * base_size + 2 * small_space + 2 * border;
    canvas.element.height = all_samples.length * base_size + all_samples.length * big_space + 2 * border;

    const ctx = canvas.element.getContext("2d")!;

    ctx.fillStyle = puzzle.state === 'solved'? (puzzle.type === 2? "#2222FF" : "#AAFFAA")
        : puzzle.state === 'half-solved'? "#8888FF"
        : puzzle.state === 'failed'? (puzzle.type === 2? "#FF2222" : "#FFAAAA") 
        : puzzle.state === 'old'? "#FFFFAA" 
        : puzzle.state === 'invalid'? "#EEEEEE" 
        : puzzle.state === 'bug'? (puzzle.type === 2? "#FF2222" : "#FFEEEE") 
        : puzzle.state === 'marked'? "#FFA500"
        : "#FFFFFF";
    ctx.fillRect(0, 0, canvas.element.width, canvas.element.height);

    if (puzzle.last_puzzle) {
        ctx.strokeStyle = "green";
        ctx.lineWidth = 15;
        ctx.strokeRect(0, 0, canvas.element.width, canvas.element.height);
    }

    function draw_grid(x0: number, y0: number, x1: number, y1: number, grid: number[][]) {
        try {
            const nj = grid.length;
            const ni = grid[0].length;
    
            const n = Math.max(ni, nj);
            
            const w = (x1 - x0) / n;
            const h = (y1 - y0) / n;
    
            for (let i = 0; i < ni; i++) {
                for (let j = 0; j < nj; j++) {
                    const xx0 = x0 + i * w;
                    const yy0 = y0 + j * h;
                    ctx.fillStyle = colors[grid[j][i]];
                    ctx.fillRect(xx0, yy0, 0.9*w, 0.9*h)
                }
            }    
        } catch (e) {
            console.error(e);
        }
    }

    function draw_sample(x0: number, y0: number, width: number, height: number, space: number, sample: ArcSample) {
        if (sample) {
            draw_grid(x0, y0, x0 + width, y0 + height, sample.input);
            draw_grid(x0 + width + space, y0, x0 + 2 * width + space, y0 + height, sample.output);
            if (sample.solution) {
                draw_grid(x0 + 2 * width + 2 * space, y0, x0 + 3 * width + 2 * space, y0 + height, sample.solution);
            }  
        }
    }

    for (let i = 0; i < all_samples.length; i++) {
        draw_sample(border, border + i * (base_size + big_space) + (i >= puzzle.train.length? big_space : 0), base_size, base_size, small_space, all_samples[i]);
    }

    return canvas;
}
  