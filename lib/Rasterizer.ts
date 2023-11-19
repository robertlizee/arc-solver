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
import { ConcreteImage } from "./ConcreteImage";
import { Grid } from "./Grid";
import { log } from "./Logger";
import { all, range } from "./Misc";
import { ColorFunction, F, number_function, prefix_generation, Solver } from "./Solver";
import { NumberFunction } from "./Solver";
import { SymbolicImage } from "./SymbolicImage";

export class Tile extends SymbolicImage {

    coord: number;
    origin: Color[] = [];
    data: Color[] = [];
    size: number;
    key: string;

    constructor(public x: number, public y: number, public radius: number, public input_grid: Grid, public output_grid?: Grid, data?: number[]) {
        super();
        this.coord = y * input_grid.width + x;
        this.size = 2 * radius + 1;
        for (let yy = y - radius; yy <= y + radius; yy++) {
            for (let xx = x - radius; xx <= x + radius; xx++) {
                const color = input_grid.at(xx, yy);
                this.origin.push(color !== undefined? color : Color.no_color);
            }
        }
        this.data = data ?? [...this.origin];
        this.key = `${this.coord}:${this.data.map(x => x.toString()).join(',')}`;
    }

    set(x: number, y: number, color: Color) {
        const data = [...this.data];
        const dx = x - this.x;
        const dy = y - this.y;

        if (Math.abs(dx) <= this.radius && Math.abs(dy) <= this.radius) {
            data[(dy+this.radius)*this.size + dx+this.radius] = color;
        }

        return new Tile(this.x, this.y, this.radius, this.input_grid, this.output_grid, data);
    }

    at(x: number, y: number) {
        const dx = x - this.x;
        const dy = y - this.y;

        if (Math.abs(dx) <= this.radius && Math.abs(dy) <= this.radius) {
            return this.data[(dy+this.radius)*this.size + dx+this.radius];
        } else {
            return Color.no_color;
        }
    }

    at_center() {
        return this.at(this.x, this.y);
    }

    number_functions(): NumberFunction[] {
        return ['x', 'y'].map(number_function);
    }

    color_functions(): ColorFunction[] {
        return [...this.data.map((_, i) => F.make<Color, SymbolicImage>('data', undefined, i)),
            ...this.origin.map((_, i) => F.make<Color, SymbolicImage>('origin', undefined, i))];
    }

    get target(): Color {
        const color = this.output_grid!.at(this.x, this.y)!;

        return color === this.at(this.x, this.y)!? Color.no_color : color;
    }

    get target_function(): ColorFunction {
        return number_function('target');
    }
}

export class Rasterizer<I extends ConcreteImage> extends ConcreteImage {

    width: number;
    height: number;

    tile_index: Map<string, number>[] = [];

    tiles: Tile[][] = [];

    tile_grid: number[][] = [];

    tile_functions: ColorFunction[] = [];

    constructor(public tile_radius: number, public image: I, public input_grid: Grid, public output_grid?: Grid) {
        super();
        this.width = input_grid.width;
        this.height = input_grid.height;

        this.reset_tiles(0);
    }

    tile_at(layer: number, x: number, y: number) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return undefined;
        }
        const coord = this.tile_grid[layer][y * this.width + x];
        return this.tiles[layer][coord];
    }

    set_tile(layer: number, tile: Tile) {
        let index: number;

        if (this.tile_index[layer].has(tile.key)) {
            index = this.tile_index[layer].get(tile.key)!;
        } else {
            index = this.tiles[layer].length;
            this.tiles[layer].push(tile);
            this.tile_index[layer].set(tile.key, index);
        }

        this.tile_grid[layer][tile.coord] = index;

        return index;
    }

    grid_at_layer(layer: number) {
        const grid = new Grid(this.width, this.height);

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                grid.set(x, y, this.tile_at(layer, x, y)?.at_center()!)
            }
        }

        return grid;
    }

    final_grid() {
        if (this.tile_functions.length > 0) {
            return this.grid_at_layer(this.tile_functions.length-1);
        } else {
            return new Grid(this.width, this.height, Color.not_written);
        }
    }

    draw_at(layer: number, x: number, y: number, c: Color, coords_affected: Set<number>) {
        //log(`draw_at(${x}, ${y}, ${c})`);
        for (let xx = x - this.tile_radius; xx <= x + this.tile_radius; xx++) {
            for (let yy = y - this.tile_radius; yy <= y + this.tile_radius; yy++) {
                const tile = this.tile_at(layer, xx, yy);
                if (tile) {
                    //log(`new tile at (${xx}, ${yy})`);
                    const updated_tile = tile.set(x, y, c);
                    coords_affected.add(updated_tile.coord);
                    this.set_tile(layer, updated_tile);
                //} else {
                //    log(`no tile at (${xx}, ${yy})`);
                }
            }
        }
    }

    reset_tiles(layer: number) {
        while (this.tile_index.length <= layer) {
            this.tile_index.push(new Map());
            this.tiles.push([]);
            this.tile_grid.push([...range(this.width * this.height)])
        }
        if (layer === 0) {
            for (let x = 0; x < this.width; x++) {
                for (let y = 0; y < this.height; y++) {
                    this.set_tile(0, new Tile(x, y, this.tile_radius, this.input_grid, this.output_grid));
                }
            }    
        } else {
            for (let x = 0; x < this.width; x++) {
                for (let y = 0; y < this.height; y++) {
                    this.set_tile(layer, this.tile_at(layer-1, x, y)!);
                }
            }    
        }
    }

    rasterize_layer(layer: number) {
        this.reset_tiles(layer);

        const coords_to_process = new Set(range(this.width * this.height));
        const func = this.tile_functions[layer];
        let error_count = 0;
        const tiles_count_before = this.tiles[layer].length;

        if (func) {
            log(func.path);
            while (coords_to_process.size > 0) {
                for (const coord of [...coords_to_process]) {
                    const tile_index = this.tile_grid[layer][coord];
                    const tile = this.tiles[layer][tile_index];
                    const color = func.f(this, tile_index);
                    //log(`tile_index: ${tile_index}, color: ${color}, tide.data[8]: ${tile.data[8]}, tide.data[12]: ${tile.data[12]}, tide.data[16]: ${tile.data[16]}`);
                    //log(tile);
                    if (color >= 0 && color !== tile.at_center()) {
                        if (!this.output_grid || this.output_grid.at(tile.x, tile.y) === color) {
                            this.draw_at(layer, tile.x, tile.y, color, coords_to_process);
                        } else {
                            error_count++;
                        }    
                    }    
                    coords_to_process.delete(coord);
                    //log(`coord: ${coord}, index: ${tile_index}`);
                }
            }    
        }

        const tiles_count_after = this.tiles[layer].length;
        const new_tile_count = tiles_count_after - tiles_count_before;

        const result = { error_count, new_tile_count };

        log(result);

        return result;
    }

    rasterize() {
        for (let layer = 0; layer < this.tile_functions.length; layer++) {
            this.rasterize_layer(layer);
        }

        return this.final_grid();
    }

    static async learn_rasterization<I extends ConcreteImage>(input_grids: Grid[], output_grids: Grid[], input_decomposer: (grid: Grid) => I, tile_radius = 2) {

        return;
        const rasterizers: Rasterizer<I>[] = [];

        for (let i = 1; i < input_grids.length; i++) {
            rasterizers.push(new Rasterizer(tile_radius, input_decomposer(input_grids[i]), input_grids[i], output_grids[i]));
        }

        const solver = await Solver.make(rasterizers, rasterizers);

        let layer = 0;

        while (Rasterizer.learn_layer(solver, layer++)) {
            //
            break;
        }

        if (all(rasterizers, rasterizer => rasterizer.output_grid!.equals(rasterizer.grid_at_layer(layer-1)))) {
            const tile_functions = [...rasterizers[0].tile_functions];
            return (grid: Grid) => {
                const rasterizer = new Rasterizer(tile_radius, input_decomposer(grid), grid);
                rasterizer.tile_functions = [...tile_functions];
                return rasterizer.rasterize();
            }
        } else {
            const tile_functions = [...rasterizers[0].tile_functions];
            return (grid: Grid) => {
                const rasterizer = new Rasterizer(tile_radius, input_decomposer(grid), grid);
                rasterizer.tile_functions = [...tile_functions];
                return rasterizer.rasterize();
            }
        }
    }

    static make_sub_solver(solver: Solver, layer: number) {
        const prefix = <X> () => prefix_generation<X>(F.make<SymbolicImage[], Rasterizer<ConcreteImage>>(`tiles[${layer}]`, rasterizer => rasterizer.tiles[layer]), 0);
        const sub_solver = new Solver({ no_sub_table_analysis: true, no_equal: true });
        sub_solver.sub_init(solver, {
            length_function: F.make<number, Rasterizer<ConcreteImage>>(`tiles[${layer}].length`, rasterizer => rasterizer.tiles[layer].length),
            index_function: F.make<number, Rasterizer<ConcreteImage>>(`i0`, (_raterizer, i0) => i0, undefined, true),
            sub_images_functions: [],
            number_functions: (solver.first_sample().input_image as Rasterizer<ConcreteImage>).tiles[layer][0].number_functions().map(prefix()),
            color_functions: (solver.first_sample().input_image as Rasterizer<ConcreteImage>).tiles[layer][0].color_functions().map(prefix()),
            grid_number_functions: [],
        });
        return sub_solver;
    }

    static compute_tile_function(solver: Solver, layer: number) {
        const sub_solver = Rasterizer.make_sub_solver(solver, layer);
        const prefix = prefix_generation<Color>(F.make<SymbolicImage[], Rasterizer<ConcreteImage>>(`tiles[${layer}]`, rasterizer => rasterizer.tiles[layer]), 0);
        const target_function = prefix(F.make<Color, Tile>('target'));

        return sub_solver.select_best_function(target_function, true, 'color');
    }

    static async learn_layer(solver: Solver, layer: number) {
        const images = [...solver.samples()].map(sample => sample.input_image as Rasterizer<ConcreteImage>);
        let tile_function: F<Color> | undefined = undefined;

        let count = 10;
        while (count-- > 0) {
            for (const image of images) {
                image.reset_tiles(layer);
            }

            let done = true;

            if (tile_function) {
                for (const image of images) {
                    const { error_count, new_tile_count } = image.rasterize_layer(layer);
                    if (error_count > 0 || new_tile_count > 0) {
                        done = false;
                    }
                }    
            } else {
                done = false;
            }

            if (done) {
                return true;
            }

            const new_tile_function = await Rasterizer.compute_tile_function(solver, layer);

            if (new_tile_function && new_tile_function.bitfield !== 0n) {
                tile_function = new_tile_function.func;
                for (const image of images) {
                    image.tile_functions[layer] = tile_function;
                }
            } else {
                return false;
            }
        }
    }
}
