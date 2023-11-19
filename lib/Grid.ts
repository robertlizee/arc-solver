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
import { Transform } from "./Transform";

export class MetaGrid<X> {
    grid: (X | undefined)[][];

    constructor(public width: number, public height: number, x?: X) {
        this.grid = [];

        for (let j = 0; j < height; j++) {
            const row: (X | undefined)[] = [];
            for (let i = 0; i < width; i++) {
                row.push(x);
            }
            this.grid.push(row);
        }
    }

    meta_clone(): MetaGrid<X> {
        const grid = new MetaGrid<X>(this.width, this.height);

        for (let j = 0; j < this.height; j++) {
            const this_row = this.grid[j];
            const grid_row = grid.grid[j];
            for (let i = 0; i < this.width; i++) {
                grid_row[i] = this_row[i];
            }
        }

        return grid;
    }

    meta_clear_clone(x?: X): MetaGrid<X> {
        const grid = new MetaGrid<X>(this.width, this.height, x);

        return grid;
    }

    meta_subgrid(x0: number, y0: number, x1: number, y1: number): MetaGrid<X> {
        const grid = new MetaGrid<X>(x1 - x0, y1 - y0);

        for (let j = 0; j < grid.height; j++) {
            const this_row = this.grid[y0 + j];
            const grid_row = grid.grid[j];
            for (let i = 0; i < grid.width; i++) {
                grid_row[i] = this_row[x0 + i];
            }
        }

        return grid;
    }

    set(x: number, y: number, xx: X): void {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.grid[y][x] = xx;
        }
    }

    at(x: number, y: number): X | undefined {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.grid[y][x];
        } else {
            return undefined;
        }
    }

    equals(grid: MetaGrid<X>): boolean {
        if (this.width === grid.width && this.height === grid.height) {
            for (let j = 0; j < this.height; j++) {
                const this_row = this.grid[j];
                const grid_row = grid.grid[j];
                for (let i = 0; i < this.width; i++) {
                    if (grid_row[i] !== this_row[i]) {
                        return false;
                    }
                }
            }
    
            return true;
        } else {
            return false;
        }
    }

    meta_map<Y>(func: (x: X) => Y): MetaGrid<Y> {
        const grid = new MetaGrid<Y>(this.width, this.height);

        for (let j = 0; j < this.height; j++) {
            const this_row = this.grid[j];
            const grid_row = grid.grid[j];
            for (let i = 0; i < this.width; i++) {
                grid_row[i] = func(this_row[i]!);
            }
        }

        return grid;
    }

    recombine(func: (x: X) => Grid): Grid {
        const mapped = this.meta_map(func);
        const x0s = [0];
        const y0s = [0];
        let width = 0;
        let height = 0;

        for (let x = 0; x < mapped.width; x++) {
            width += mapped.at(x, 0)!.width;
            x0s.push(width);
        }
        for (let y = 0; y < mapped.height; y++) {
            height += mapped.at(0, y)!.height;
            y0s.push(height);
        }

        const output = new Grid(width, height);

        for (let x = 0; x < mapped.width; x++) {
            for (let y = 0; y < mapped.height; y++) {
                output.paste(mapped.at(x, y)!, { offset_x: x0s[x], offset_y: y0s[y]});
            }
        }

        return output;
    }

    foreach(output: (x: X | undefined) => void) {
        for (let j = 0; j < this.height; j++) {
            const this_row = this.grid[j];
            for (let i = 0; i < this.width; i++) {
                output(this_row[i]);
            }
        }         
    }

    count(test: (x: X | undefined) => boolean): number {
        let count = 0;

        this.foreach(x => {
            if (test(x)) {
                count++;
            }
        });

        return count;
    }

    count_perimeter(test: (x: X | undefined) => boolean): number {
        let count = 0;
        const first_row = this.grid[0];
        const last_row = this.grid[this.height-1];
        for (let i = 0; i < this.width; i++) {
            if (test(first_row[i])) {
                count++;
            }
            if (test(last_row[i])) {
                count++;
            }
        }
        for (let j = 1; j < this.height-1; j++) {
            if (test(this.grid[j][0])) {
                count++;
            }
            if (test(this.grid[j][this.width-1])) {
                count++;
            }
        }

        return count;
    }
}

export class Grid extends MetaGrid<Color> {

    constructor(public width: number, public height: number, color?: Color) {
        color = color === undefined? Color.black : color;

        super(width, height, color);
    }

    static cast(metagrid: MetaGrid<Color>): Grid {
        const grid = new Grid(0, 0);
        grid.width = metagrid.width;
        grid.height = metagrid.height;
        grid.grid = metagrid.grid;

        return grid
    }

    static from_grid(grid: number[][]) {
        const g = new Grid(0, 0);
        g.width = grid[0].length;
        g.height = grid.length;
        g.grid = grid;

        return g;
    }

    to_grid(): number[][] {
        return this.grid as number[][];
    }

    clone(): Grid {
        return Grid.cast(super.meta_clone());
    }

    clear_clone(color?: Color): Grid {
        return Grid.cast(super.meta_clear_clone(color === undefined? Color.black : color));
    }

    subgrid(x0: number, y0: number, x1: number, y1: number): Grid {
        return Grid.cast(super.meta_subgrid(x0, y0, x1, y1));
    }

    colors(background_color?: Color): Set<Color> {
        const set: Set<Color> = new Set();

        this.foreach(color => {
            if (color !== undefined && color !== background_color) {
                set.add(color);
            }
        });

        return set;
    }

    symmetrical(transform: Transform): boolean {
        const no_switch = transform === Transform.flip_x || transform === Transform.flip_y || transform === Transform.identity
            || transform === Transform.rotate_180;
            
        const grid = no_switch? new Grid(this.width, this.height) : new Grid(this.height, this.width);

        grid.paste(this, { transform });

        return this.equals(grid);
    }

    count_holes() {
        
    }

    draw_perimeter(color: Color): void {
        const first_row = this.grid[0];
        const last_row = this.grid[this.height-1];
        for (let i = 0; i < this.width; i++) {
            first_row[i] = color;
            last_row[i] = color;
        }
        for (let j = 1; j < this.height-1; j++) {
            this.grid[j][0] = color;
            this.grid[j][this.width-1] = color;
        }
    }

    map_colors(mapping: (color: Color) => Color): Grid {
        const grid = new Grid(this.width, this.height);

        for (let j = 0; j < this.height; j++) {
            const this_row = this.grid[j];
            const grid_row = grid.grid[j];
            for (let i = 0; i < this.width; i++) {
                const c = this_row[i];
                if (c !== undefined) {
                    grid_row[i] = mapping(c);
                } else {
                    grid_row[i] = undefined;
                }
            }
        }

        return grid;
    }

    draw_infinite_line(x: number, y: number, dx: number, dy: number, color: Color) {
        if (this.at(x, y) !== undefined) {
            this.set(x, y, color);
            this.draw_infinite_line(x+dx, y+dy, dx, dy, color);
        }
    }

    draw_line(x0: number, y0: number, x1: number, y1: number, color: Color) {
        this.set(x0, y0, color);
        const same = x0 === x1 && y0 === y1;
        if (!same) {
            const dx = x0 < x1? 1: x0 > x1? -1: 0;
            const dy = y0 < y1? 1: y0 > y1? -1: 0;
            this.draw_line(x0+dx, y0+dy, x1, y1, color);
        }
    }

    draw_box(x0: number, y0: number, x1: number, y1: number, color: Color) {
        for (let x = x0; x < x1; x++) {
            for (let y = y0; y < y1; y++) {
                this.set(x, y, color);
            }
        }
    }

    draw_box_perimiter(x0: number, y0: number, x1: number, y1: number, color: Color) {
        for (let x = x0; x < x1; x++) {
            this.set(x, y0, color);
            this.set(x, y1-1, color);
        }
        for (let y = y0; y < y1; y++) {
            this.set(x0, y, color);
            this.set(x1-1, y, color);
        }
    }

    foreach_pixel(background_color: Color, action: (x: number, y: number, color: Color) => void) {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                const color = this.at(x, y)!;
                if (color !== background_color) {
                    action(x, y, color);
                }
            }
        }
    }

    *foreach_object(corner: boolean) {
        const working_copy = this.clone();

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (working_copy.at(x, y) !== Color.black) {
                    const { obj } = this.propagate(x, y, corner);
                    yield obj;
                    working_copy.erase(obj);
                }
            }
        }
    }

    /* 244, 302 */
    *foreach_block() {
        for (const shape of this.foreach_object(false)) {
            const shape_clone = shape.clone();
            while (true) {
                const biggest_rect = shape_clone.find_biggest_block();
                if (biggest_rect) {
                    //log(biggest_rect);
                    const { x0, y0, x1, y1 } = biggest_rect;
                    const sub_shape = shape_clone.clear_clone();
                    for (let x = x0; x < x1; x++) {
                        for (let y = y0; y < y1; y++) {
                            sub_shape.set(x, y, shape_clone.at(x, y)!);
                            shape_clone.set(x, y, Color.black);
                        }
                    }
                    yield sub_shape;
                } else {
                    break;
                }             
            }
        }
    }

    find_biggest_block() {
        let biggest_area = 0;
        let biggest_rect: { x0: number, y0: number, x1: number, y1: number } | undefined = undefined;

        for (let x0 = 0; x0 < this.width; x0++) {
            for (let y0 = 0; y0 < this.height; y0++) {
                if (this.at(x0, y0) === Color.black) {
                    continue;
                }
                let x1 = this.width;
                for (let y1 = y0+1; y1 <= this.height; y1++) {
                    for (let x = x0; x < x1; x++) {
                        if (this.at(x, y1-1) === Color.black) {
                            x1 = x;
                            break;
                        }
                    }
                    const area = (x1 - x0) * (y1 - y0);
                    if (area === 0) {
                        break;
                    }

                    if (area > biggest_area) {
                        biggest_area = area;
                        biggest_rect = { x0, y0, x1, y1 };
                    }
                }
            }
        }
        return biggest_rect;
    }

    erase(grid: Grid) {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (grid.at(x, y) !== Color.black) {
                    this.set(x, y, Color.black);
                }
            }
        }
    }

    /**
     * Find all the connected regions in the grid of the given color
     */
    findConnectedRegion(_color: Color): Grid[] {
        const output: Grid[] = [];
        return output;
    }

    /**
     * Find all the colors surrounding a given region Color.outside is used if the region touches the end of the grid
     */
    surrounding(_region: Grid): Set<Color> {
        const result: Set<Color> = new Set();

        return result;
    }

    /**
     * Paste the region on the grid, the black in the region mean invisible
     */
    paste(region: Grid, params?: { 
        anchor_x?: number,
        anchor_y?: number,
        offset_x?: number, 
        offset_y?: number, 
        transform?: Transform,
        transparent_color?: Color,
        monochrome_color?: Color,
        only_if_no_color?: boolean, 
    }): void {
        let set: (x: number, y: number, c: Color) => void;

        params = params ?? {};

        params.offset_x = params.offset_x ?? 0;
        params.offset_y = params.offset_y ?? 0;

        if (params.anchor_x === undefined && params.anchor_y === undefined) {
            if (params.transform === undefined || params.transform === Transform.identity) {
                set = (x, y, c) => this.set(params?.offset_x! + x, params?.offset_y! + y, c);
            } else if (params.transform === Transform.flip_x) {
                set = (x, y, c) => this.set(params?.offset_x! + region.width - 1 - x, params?.offset_y! + y, c);
            } else if (params.transform === Transform.flip_y) {
                set = (x, y, c) => this.set(params?.offset_x! + x, params?.offset_y! + region.height - 1 - y, c);
            } else if (params.transform === Transform.transpose) {
                set = (x, y, c) => this.set(params?.offset_x! + y, params?.offset_y! + x, c);
            } else if (params.transform === Transform.opposite_transpose) {
                set = (x, y, c) => this.set(params?.offset_x! + region.height - 1 - y, params?.offset_y! + region.width - 1 - x, c);
            } else if (params.transform === Transform.rotate_180) {
                set = (x, y, c) => this.set(params?.offset_x! + region.width - 1 - x, params?.offset_y! + region.height - 1 - y, c);
            } else if (params.transform === Transform.rotate_90) {
                set = (x, y, c) => this.set(params?.offset_x! + region.height - 1 - y, params?.offset_y! + x, c);
            } else if (params.transform === Transform.rotate_270) {
                set = (x, y, c) => this.set(params?.offset_x! + y, params?.offset_y! + region.width - 1 - x, c);
            } else {
                set = (x, y, c) => this.set(x, y, c);
            }
        } else {
            set = (x, y, c) => this.set(x, y, c);
        }

        if (params.only_if_no_color) {
            const old_set = set;
            set = (x, y, c) => {
                if (this.at(x, y) === params?.transparent_color) {
                    old_set(x, y, c);
                }
            }
        }

        if (params.monochrome_color !== undefined) {
            const old_set = set;
            set = (x, y, _c) => old_set(x, y, params!.monochrome_color!);
        }

        if (params.transparent_color === undefined) {
            for (let j = 0; j < region.height; j++) {
                const region_row = region.grid[j];
                for (let i = 0; i < region.width; i++) {
                    set(i, j, region_row[i]!);
                }
            }             
        } else {
            for (let j = 0; j < region.height; j++) {
                const region_row = region.grid[j];
                for (let i = 0; i < region.width; i++) {
                    const c = region_row[i]!;
                    if (c !== params.transparent_color) {
                        set(i, j, region_row[i]!);
                    }
                }
            }             
        }
    }

    is_solid_color(): boolean {
        const color = this.at(0, 0);

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this.at(x, y) !== color) {
                    return false;
                }
            }
        }

        return true;
    }

    trim(background_color = Color.black) {
        let x0 = 0;
        let y0 = 0;
        let x1 = this.width;
        let y1 = this.height;

        while (y0 < y1 && this.subgrid(x0, y0, x1, y0+1).is_solid_color() && this.at(x0, y0) === background_color) {
            y0++;
        }
        
        while (y0 < y1 && this.subgrid(x0, y1-1, x1, y1).is_solid_color() && this.at(x0, y1-1) === background_color) {
            y1--;
        }

        while (x0 < x1 && this.subgrid(x0, y0, x0+1, y1).is_solid_color() && this.at(x0, y0) === background_color) {
            x0++;
        }
        
        while (x0 < x1 && this.subgrid(x1-1, y0, x1, y1).is_solid_color() && this.at(x1-1, y0) === background_color) {
            x1--;
        }
        
        return { grid: this.subgrid(x0, y0, x1, y1), x: x0, y: y0 };
    }

    divide(dx: number, dy: number) {
        const output = new MetaGrid<Grid>(this.width/dx, this.height/dy);

        for (let x = 0; x < output.width; x++) {
            for (let y = 0; y < output.width; y++) {
                output.set(x, y, this.subgrid(x*dx, y*dy, (x+1)*dx, (y+1)*dy));
            }
        } 

        return output;
    }

    inv_scale(s: number) {
        const grid = new Grid(this.width / s, this.height / s);

        for (let x = 0; x < grid.width; x++) {
            for (let y = 0; y < grid.height; y++) {
                grid.set(x, y, this.at(s*x, s*y)!);
            }
        }

        return grid;
    }

    inv_scale_width_grid(s: number) {
        const grid = new Grid((this.width + 1) / (s+1), (this.height+1) / (s+1));

        for (let x = 0; x < grid.width; x++) {
            for (let y = 0; y < grid.height; y++) {
                grid.set(x, y, this.at((s+1)*x, (s+1)*y)!);
            }
        }

        return grid;
    }

    is_semantic_box() {
        if (this.width >= 3 && this.height >= 3) {
            const c1 = this.at(1, 0);
            const c2 = this.at(1, this.height-1);
            const c3 = this.at(0, 1);
            const c4 = this.at(this.width-1, 1);
            const c5 = this.at(1, 1);

            for (let x = 2; x < this.width-1; x++) {
                if (this.at(x, 0) !== c1 || this.at(x, this.height-1) !== c2) {
                    return false;
                }
            }

            for (let y = 2; y < this.height-1; y++) {
                if (this.at(0, y) !== c3 || this.at(this.width-1, y) !== c4) {
                    return false;
                }
            }

            for (let x = 1; x < this.width-1; x++) {
                for (let y = 1; y < this.height-1; y++) {
                    if (this.at(x, y) !== c5) {
                        return false;
                    }
                }
            }

            return true;
        } else {
            return false;
        }
    }

    get_semantic_box() {
        const grid = new Grid(3, 3);
        grid.set(0, 0, this.at(0, 0)!);
        grid.set(1, 0, this.at(1, 0)!);
        grid.set(2, 0, this.at(this.width-1, 0)!);
        grid.set(0, 1, this.at(0, 1)!);
        grid.set(1, 1, this.at(1, 1)!);
        grid.set(2, 1, this.at(this.width-1, 1)!);
        grid.set(0, 2, this.at(0, this.height-1)!);
        grid.set(1, 2, this.at(1, this.height-1)!);
        grid.set(2, 2, this.at(this.width-1, this.height-1)!);

        return grid;
    }

    propagate(x: number, y: number, corners?: boolean): { obj: Grid, contour: Grid } {
        const obj = this.clear_clone();
        const contour = new Grid(this.width+2, this.height+2);
        const points: [number, number][] = [];

        const add_point = (x: number, y: number) => {
            const color = this.at(x, y);
            if (color === undefined) {
                contour.set(x+1, y+1, Color.true);
            } else if (color !== Color.black && obj.at(x, y) === Color.black) {
                obj.set(x, y, color);
                points.push([x, y]);
            }
        }

        add_point(x, y);

        while (points.length > 0) {
            const [x, y] = points.pop()!;
            add_point(x-1, y);
            add_point(x+1, y);
            add_point(x, y-1);
            add_point(x, y+1);

            if (corners) {
                add_point(x-1, y-1);
                add_point(x+1, y-1);
                add_point(x-1, y+1);
                add_point(x+1, y+1);
            }
        }

        return { obj, contour };
    }

    complement(): Grid {
        const c = this.clear_clone();

        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (this.at(x, y) === Color.false) {
                    c.set(x, y, Color.true);
                }
            }
        }

        return c;
    }

    horizontal_colors(y: number): Set<Color> {
        const colors = new Set<Color>();
        for (let x = 0; x < this.width; x++) {
            colors.add(this.at(x, y)!);
        }
        return colors;
    }

    vertical_colors(x: number): Set<Color> {
        const colors = new Set<Color>();
        for (let y = 0; y < this.height; y++) {
            colors.add(this.at(x, y)!);
        }
        return colors;
    }

    find_master_grid(default_grid_color?: Color): { cells: { x: number, y: number, grid: Grid }[], grid_color?: Color, stride: number } {
        const hs: Set<Color>[] = [];
        const vs: Set<Color>[] = [];
        const potential_grid_colors = new Set<Color>()


        for (let x = 0; x < this.width; x++) {
            const line = this.vertical_colors(x);
            vs.push(line);
            if (line.size === 1) {
                potential_grid_colors.add(line.values().next().value);
            }
        }

        for (let y = 0; y < this.height; y++) {
            const line = this.horizontal_colors(y);
            hs.push(line);
            if (line.size === 1) {
                potential_grid_colors.add(line.values().next().value);
            }
        }

        if (default_grid_color !== undefined) {
            potential_grid_colors.clear();
            potential_grid_colors.add(default_grid_color);
        }

        for (const grid_color of potential_grid_colors) {
            const xs: number[] = [-1];
            const ys: number[] = [-1];
                
            for (let x = 0; x < this.width; x++) {
                if (vs[x].size === 1 && vs[x].has(grid_color)) {
                    xs.push(x);
                }
            }
            xs.push(this.width);
    
            for (let y = 0; y < this.height; y++) {
                if (hs[y].size === 1 && hs[y].has(grid_color)) {
                    ys.push(y);
                }
            }

            ys.push(this.height);
    
            const cells: { x: number, y: number, grid: Grid}[] = [];

            let stride = 0;
            let valid = true;

            for (let j = 0; j < ys.length-1; j++) {
                const y0 = ys[j] + 1;
                const y1 = ys[j+1];
                if (y0 < y1) {
                    stride = 0;
                    for (let i = 0; i < xs.length-1; i++) {
                        const x0 = xs[i] + 1;
                        const x1 = xs[i+1];
                        if (x0 < x1) {
                            const subgrid = this.subgrid(x0, y0, x1, y1 );
                            if (subgrid.colors().has(grid_color) && default_grid_color === undefined) {
                                valid = false;
                            }
                            stride++;
                            cells.push({ x: x0, y: y0, grid: subgrid});
                        }
                    }        
                }
            }

            if (valid) {
                return { cells, grid_color, stride };
            }
        }

        return { cells: [{x:0, y:0, grid:this}], stride:1}

    }

    is_scaled_by(n: number) {
        if (this.width % n === 0 && this.height % n === 0) {
            for (let x = 0; x < this.width; x += n) {
                for (let y = 0; y < this.height; y += n) {
                    const c = this.at(x, y);

                    for (let xx = x; xx < x + n; xx++) {
                        for (let yy = y; yy < y + n; yy++) {
                            if (this.at(xx, yy) !== c) {
                                return false;
                            }
                        }
                    }
                }
            }
            return true;
        } else {
            return false;
        }
    }

    is_scaled_with_grid_by(n: number) {
        
        if ((this.width + 1) % (n + 1) === 0 && (this.height + 1) % (n + 1) === 0) {
            let grid_color = this.width > n? this.at(n, 0) : this.height > n? this.at(0, n) : Color.no_color;
            for (let x = 0; x < this.width; x += n + 1) {
                for (let y = 0; y < this.height; y += n + 1) {
                    const c = this.at(x, y);

                    for (let xx = x; xx < x + n; xx++) {
                        for (let yy = y; yy < y + n; yy++) {
                            if (this.at(xx, yy) !== c) {
                                return Color.no_color;
                            }
                        }
                    }

                    if (x + n + 1 < this.width) {
                        for (let yy = y; yy < y + n; yy++) {
                            if (this.at(x + n, yy) !== grid_color) {
                                return Color.no_color;
                            }
                        }
                    }

                    if (y + n + 1 < this.height) {
                        for (let xx = x; xx < x + n; xx++) {
                            if (this.at(xx, y + n) !== grid_color) {
                                return Color.no_color;
                            }
                        }
                    }

                    if (x + n + 1 < this.width && y + n + 1 < this.height) {
                        if (this.at(x+n, y+n) !== grid_color) {
                            return Color.no_color;
                        }
                    }
                }
            }
            return grid_color;
        } else {
            return Color.no_color;
        }
    }

    get_scaling_factor() {
        for (let i = 1; i < this.width; i++) {
            if (this.width % i === 0) {
                const s = this.width / i;
                if (this.is_scaled_by(s)) {
                    return s;
                }
            }
        }        

        return 1;
    }

    get_scaling_factor_with_grid_color() {
        for (let i = 1; i < this.width; i++) {
            if ((this.width + 1) % i === 0) {
                const scale = (this.width+1) / i - 1;
                const grid_color = this.is_scaled_with_grid_by(scale);
                if (grid_color !== Color.no_color) {
                    return { scale, grid_color };
                }
            }
        }       
    }

    find_tile() : Grid {
        let tile_x = this.width;
        let tile_y = this.height;

        for (let width = 1; width <= 0.75 * this.width; width++) {
            let ok = true;

            for (let x = 0; ok && x < this.width - width; x++) {
                for (let y = 0; ok && y < this.height; y++) {
                    if (this.at(x, y) !== this.at(x+width, y)) {
                        ok = false;
                        break;
                    }
                }
            }

            if (ok) {
                tile_x = width;
                break;
            }
        }

        for (let height = 1; height <= 0.75 * this.height; height++) {
            let ok = true;

            for (let x = 0; ok && x < this.width; x++) {
                for (let y = 0; ok && y < this.height - height; y++) {
                    if (this.at(x, y) !== this.at(x, y + height)) {
                        ok = false;
                        break;
                    }
                }
            }

            if (ok) {
                tile_y = height;
                break;
            }
        }

        return this.subgrid(0, 0, tile_x, tile_y);
    }

    toString() {
        return `[${this.grid.map(row => `[${row.map(x => x?.toString()).join(',')}]`).join(',')}]`;
    }
}

