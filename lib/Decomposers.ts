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

import { Abstraction } from "./Abstraction";
import { Color } from "./Color";
import { Grid } from "./Grid";
import { highest } from "./Misc";
import { Alternatives, BackgroundColor, BasicImage, ConcreteImage, ImageData, ImageTransformation, ImageWindow, Info, MonochromeColor, Pixel, Scale, SemanticBox, SolidColor, SubImages, Translation } from "./ConcreteImage";
import { Transform } from "./Transform";
import { Decomposer } from "./DecomposersData";
import { log } from "./Logger";

export function fbasic_grid(grid: Grid): BasicImage {
    const list: Color[] = []
    for (const row of grid.grid) {
        for (const elem of row) {
            list.push(elem!);
        }
    }
    return new BasicImage(list, grid.width);
}

export function build_decomposer(decomposer: Decomposer): (grid: Grid) => ConcreteImage {
    function image_window<I extends ConcreteImage>(decomposer: (grid: Grid) => I) {
        return (grid: Grid): ImageWindow<I> => {
            return new ImageWindow(0, 0, grid.width, grid.height, decomposer(grid));
        }
    }
    
    function basic_grid(grid: Grid): BasicImage {
        const list: Color[] = []
        for (const row of grid.grid) {
            for (const elem of row) {
                list.push(elem!);
            }
        }
        return new BasicImage(list, grid.width);
    }
    
    function object_list<I extends ConcreteImage>(decomposer: (grid: Grid) => I) {
        return (grid: Grid) => {
            const children: I[] = [];
            for (const obj of grid.foreach_object(false)) {
                children.push(decomposer(obj));
            };
            return new SubImages(children, 'free');
        }
    }
    
    function object_list2<I extends ConcreteImage>(decomposer: (grid: Grid) => I) {
        return (grid: Grid) => {
            const children: I[] = [];
            for (const obj of grid.foreach_object(true)) {
                children.push(decomposer(obj));
            };
            return new SubImages(children, 'free');
        }
    }
    
    function block_list<I extends ConcreteImage>(decomposer: (grid: Grid) => I) {
        return (grid: Grid) => {
            const children: I[] = [];
            for (const obj of grid.foreach_block()) {
                children.push(decomposer(obj));
            };
            return new SubImages(children, 'free');
        }
    }
    
    function scaled<I extends ConcreteImage>(decomposer: (grid: Grid) => I) {
        return (grid: Grid) => {
    
            const sg = grid.get_scaling_factor_with_grid_color();
    
            if (sg) {
                const { scale, grid_color } = sg;
                return new Scale(scale, decomposer(grid.inv_scale_width_grid(scale)), grid_color);    
            } else {
                const s = grid.get_scaling_factor();
                return new Scale(s, decomposer(grid.inv_scale(s)));    
            }
        }
    }
    
    function tile<I extends ConcreteImage>(decomposer: (grid: Grid) => I) {
        return (grid: Grid) => {
            return new ImageTransformation(Transform.tile, decomposer(grid.find_tile()));
        }
    }
    
    function tile_x<I extends ConcreteImage>(decomposer: (grid: Grid) => I) {
        return (grid: Grid) => {
            return new ImageTransformation(Transform.tile_x, decomposer(grid.find_tile()));
        }
    }
    
    function tile_y<I extends ConcreteImage>(decomposer: (grid: Grid) => I) {
        return (grid: Grid) => {
            return new ImageTransformation(Transform.tile_y, decomposer(grid.find_tile()));
        }
    }
    
    function transform<I extends ConcreteImage>(t: Transform, decomposer: (grid: Grid) => I) {
        return (grid: Grid) => {
            return new ImageTransformation(t, decomposer(new ImageTransformation(t, basic_grid(grid)).to_grid()));
        }
    }
    
    
    function semantic_box (grid: Grid) {
        if (grid.is_semantic_box()) {
            const box = grid.get_semantic_box();
            return new SemanticBox(grid.width, grid.height, [box.at(0, 0)!, box.at(1, 0)!, box.at(2, 0)!, box.at(0, 1)!, box.at(1, 1)!, box.at(2, 1)!, box.at(0, 2)!, box.at(1, 2)!, box.at(2, 2)!, ]);
        } else {
            throw new Error('Not a semantic box');
        }
    }
    
    function trim_object<I extends ConcreteImage>(decomposer: (grid: Grid) => I) {
        return (grid: Grid) => {
            const trim = grid.trim();
            return new Translation(trim.x, trim.y, decomposer(trim.grid));
        }
    }
    
    function trim_object_center<I extends ConcreteImage>(decomposer: (grid: Grid) => I) {
        return (grid: Grid) => {
            const trim = grid.trim();
            return new Translation(trim.x + trim.grid.width/2, trim.y + trim.grid.height/2, decomposer(trim.grid).translate(-trim.grid.width/2, -trim.grid.height/2));
        }
    }
    
    function monochrome<I extends ConcreteImage>(decomposer: (grid: Grid) => I) {
        return (grid: Grid): MonochromeColor<I> => {
            const colors = grid.colors(Color.black);
            const monochrome_grid = grid.map_colors((color: Color) => color === Color.black? Color.false : Color.true);
    
            if (colors.size > 1) {
                throw 'not-a-monochrome-image';
            } else if (colors.size === 0) {
                return new MonochromeColor(Color.blue, decomposer(monochrome_grid));    
            } else {
                return new MonochromeColor(colors.values().next().value, decomposer(monochrome_grid));
            }
        }
    }
    
    function solid_color(grid: Grid): SolidColor {
        const colors = grid.colors();
        
        if (colors.size > 1) {
            throw 'not-a-solid-color';
        } else {
            return new SolidColor(colors.values().next().value);
        }
    }
    
    function background<I extends ConcreteImage>(background_color: Color | undefined, decomposer: (grid: Grid) => I) {
        return (grid: Grid): BackgroundColor<I> => {
            let color = background_color;
            if (background_color === undefined) {
                const colors = grid.colors();
                color = highest(colors, color => grid.count(c => c === color));
            }
            return new BackgroundColor(color!, decomposer(
                grid.map_colors(c => c === color? Color.black : c === Color.black? color! : c)
            ));
        }
    }
    
    function color_decomposition<I extends ConcreteImage>(decomposer: (grid: Grid) => I) {
        return (grid: Grid) => {
            const colors = grid.colors(Color.black);
            const colors_sorted = [...colors];
            colors_sorted.sort((a, b) => a - b)
            const decomposition: MonochromeColor<I>[] = [];
            for (const color of colors_sorted) {
                decomposition.push(new MonochromeColor(color, decomposer(grid.map_colors(c => c === color? Color.true : Color.false))));
            }
            return new SubImages(decomposition, 'free');
        }
    }
    
    function monochrome_object_list<I extends ConcreteImage>(decomposer: (grid: Grid) => I) {
        return (grid: Grid) => {
            const first_pass = color_decomposition(object_list(decomposer))(grid);
    
            const decomposition: MonochromeColor<I>[] = [];
            for (const mono_objs of first_pass.list) {
                for (const obj of mono_objs.image.list) {
                    decomposition.push(new MonochromeColor(mono_objs.color, obj));
                }
            }
    
            return new SubImages(decomposition, 'free');
        }
    }
    
    function monochrome_object_list_abstraction(name: string, decomposers: ((grid: Grid) => ConcreteImage)[]) {
        return (grid: Grid) => {
            const decomposer: (grid: Grid) => ConcreteImage = (grid) => {
                for (const d of decomposers) {
                    try {
                        return d(grid);
                    } catch (e) {
                        log(grid);
                        if (e instanceof Error) {
                            log(e.message);
                        } else {
                            log(e);
                        }
                    }
                }
                throw new Error("Can't decompose image");
            }
    
            const first_pass = color_decomposition(object_list(decomposer))(grid);
    
            const decomposition: ConcreteImage[] = [];
            for (const mono_objs of first_pass.list) {
                for (const obj of mono_objs.image.list) {
                    decomposition.push(new MonochromeColor(mono_objs.color, obj));
                }
            }
    
            return new Abstraction(name, decomposition);        
        }
    }
    
    function monochrome_decomposition_abstraction(name: string, decomposers: ((grid: Grid) => ConcreteImage)[]) {
        return (grid: Grid) => {
            const decomposer: (grid: Grid) => ConcreteImage = (grid) => {
                for (const d of decomposers) {
                    try {
                        return d(grid);
                    } catch (e) {
                        log(grid);
                        if (e instanceof Error) {
                            log(e.message);
                        } else {
                            log(e);
                        }
                    }
                }
                throw new Error("Can't decompose image");
            }
    
            const first_pass = color_decomposition(decomposer)(grid);
    
            return new Abstraction(name, first_pass.list);        
        }
    }
    
    function simple_abstraction(name: string, decomposer: ((grid: Grid) => ConcreteImage)) {
        return (grid: Grid) => {
            
            return new Abstraction(name, [decomposer(grid)]);        
        }
    }
    
    function monochrome_object_list2<I extends ConcreteImage>(decomposer: (grid: Grid) => I) {
        return (grid: Grid) => {
            const first_pass = color_decomposition(object_list2(decomposer))(grid);
    
            const decomposition: MonochromeColor<I>[] = [];
            for (const mono_objs of first_pass.list) {
                for (const obj of mono_objs.image.list) {
                    decomposition.push(new MonochromeColor(mono_objs.color, obj));
                }
            }
    
            return new SubImages(decomposition, 'free');
        }
    }
    
    function horizontal_decomposition<I extends ConcreteImage>(decomposer: (grid: Grid) => I, fixed_size = false) {
        return (grid: Grid) => {
            const sub_images: I[] = [];
    
            for (let y = 0; y < grid.height; y++) {
                const sub_grid = grid.clear_clone();
                let empty = true;
                for (let x = 0; x < grid.width; x++) {
                    const c = grid.at(x, y)!;
                    if (c !== Color.black) {
                        empty = false;
                        sub_grid.set(x, y, c);
                    }
                }
                if (!empty) {
                    sub_images.push(decomposer(sub_grid));
                }
            }
    
            return new SubImages(sub_images, 'free', undefined, fixed_size);
        }
    }
    
    function complement<I extends ConcreteImage>(decomposer: (grid: Grid) => I) {
        return (grid: Grid) => {
            return decomposer(grid.complement());
        }
    }
    
    function find_master_grid<I extends ConcreteImage>(decomposer: (grid: Grid) => I, default_grid_color?: Color, fixed_size = false) {
        return (grid: Grid) => {
            const master_grid = grid.find_master_grid(default_grid_color);
    
            return new SubImages(master_grid.cells.map((cell, index) => new ImageData(
                [index, index % master_grid.stride, (index - index % master_grid.stride) / master_grid.stride, (index % master_grid.stride)/(master_grid.stride-1), ((index - index % master_grid.stride) / master_grid.stride)/(master_grid.cells.length/master_grid.stride-1)], 
                new Translation(cell.x, cell.y, decomposer(cell.grid)))), master_grid.stride, master_grid.grid_color, fixed_size);
        }
    }
    
    function master_grid<I extends ConcreteImage>(sx: number, sy: number, decomposer: (grid: Grid) => I) {
        return (grid: Grid) => {
            const nx = Math.floor(grid.width/sx);
            const ny = Math.floor(grid.height/sy);
            if (nx === 0 || ny === 0) {
                throw new Error("master_grid() does not work");
            }
            const subimages: ImageData<Translation<I>>[] = [];
            let index = 0;
            for (let y0 = 0; y0 < grid.height; y0 += ny) {
                for (let x0 = 0; x0 < grid.width; x0 += nx) {
                    subimages.push(new ImageData([index++, x0/nx, y0/ny, x0/(grid.width-nx), y0/(grid.height-ny)], new Translation(x0, y0, decomposer(grid.subgrid(x0, y0, x0+nx, y0+ny)))));
                }
            }
            return new SubImages(subimages, 'free', Color.black, true);
        }
    }
    
    function master_grid2<I extends ConcreteImage>(nx: number, ny: number, decomposer: (grid: Grid) => I) {
        return (grid: Grid) => {
            if (nx === 0 || ny === 0) {
                throw new Error("master_grid() does not work");
            }
            const subimages: ImageData<Translation<I>>[] = [];
            let index = 0;
            for (let y0 = 0; y0 < grid.height; y0 += ny) {
                for (let x0 = 0; x0 < grid.width; x0 += nx) {
                    subimages.push(new ImageData([index++, x0/nx, y0/ny, x0/(grid.width-nx), y0/(grid.height-ny)], new Translation(x0, y0, decomposer(grid.subgrid(x0, y0, x0+nx, y0+ny)))));
                }
            }
            return new SubImages(subimages, 'free');
        }
    }
    
    function pixel_grid(grid: Grid) {
        const subimages: ImageData<Translation<Pixel>>[] = [];
        let index = 0;
        for (let y0 = 0; y0 < grid.height; y0 += 1) {
            for (let x0 = 0; x0 < grid.width; x0 += 1) {
                subimages.push(
                    new ImageData(
                        [index++, x0, y0], 
                        new Translation(x0, y0, new Pixel(grid.at(Math.floor(x0+0.5), Math.floor(y0+0.5))))));
            }
        }
        return new SubImages(subimages, 'free');
    }
    
    function add_info<I1 extends ConcreteImage, I2 extends ConcreteImage>(decomposer1: (grid: Grid) => I1, decomposer2: (grid: Grid) => I2) {
        return (grid: Grid) => {
            return new Info(decomposer1(grid), decomposer2(grid));
        }
    }
    
    function centered<I extends ConcreteImage>(decomposer: (grid: Grid) => I) {
        return (grid: Grid) => {
            return new Translation(grid.width/2, grid.height/2, new Translation(-grid.width/2, -grid.height/2, decomposer(grid)));
        }
    }

    function alternatives(decomposers: ((grid: Grid) => ConcreteImage)[]) {
        return (grid: Grid) => {
            return new Alternatives(decomposers.map(decomposer => decomposer(grid)));
        }
    }
    
    log(`build_decomposer for ${decomposer.name}`)
    switch (decomposer.name) {
        case 'image_window': return image_window(build_decomposer(decomposer.decomposer!));
        case 'scaled': return scaled(build_decomposer(decomposer.decomposer!));
        case 'tile': return tile(build_decomposer(decomposer.decomposer!));
        case 'tile_x': return tile_x(build_decomposer(decomposer.decomposer!));
        case 'tile_y': return tile_y(build_decomposer(decomposer.decomposer!));
        case 'transform': return transform(decomposer.transform!, build_decomposer(decomposer.decomposer!));
        case 'trim_object': return trim_object(build_decomposer(decomposer.decomposer!));
        case 'trim_object_center': return trim_object_center(build_decomposer(decomposer.decomposer!));
        case 'monochrome': return monochrome(build_decomposer(decomposer.decomposer!));
        case 'background': return background(decomposer.background_color, build_decomposer(decomposer.decomposer!));
        case 'complement': return complement(build_decomposer(decomposer.decomposer!));
        case 'centered': return centered(build_decomposer(decomposer.decomposer!));

        case 'basic_grid': return basic_grid;
        case 'semantic_box': return semantic_box;
        case 'solid_color': return solid_color;
        case 'pixel_grid': return pixel_grid;
        
        case 'object_list': return object_list(build_decomposer(decomposer.decomposer!));
        case 'object_list2': return object_list2(build_decomposer(decomposer.decomposer!));
        case 'block_list': return block_list(build_decomposer(decomposer.decomposer!));
        case 'color_decomposition': return color_decomposition(build_decomposer(decomposer.decomposer!));
        case 'monochrome_object_list': return monochrome_object_list(build_decomposer(decomposer.decomposer!));
        case 'monochrome_object_list2': return monochrome_object_list2(build_decomposer(decomposer.decomposer!));
        case 'horizontal_decomposition': return horizontal_decomposition(build_decomposer(decomposer.decomposer!));
        case 'find_master_grid': return find_master_grid(build_decomposer(decomposer.decomposer!), decomposer.default_grid_color, decomposer.fixed_size!);
        case 'master_grid': return master_grid(decomposer.sx!, decomposer.sy!, build_decomposer(decomposer.decomposer!));
        case 'master_grid2': return master_grid2(decomposer.nx!, decomposer.ny!, build_decomposer(decomposer.decomposer!));

        case 'monochrome_object_list_abstraction': return monochrome_object_list_abstraction(decomposer.abstraction_name!, decomposer.decomposers!.map(build_decomposer));
        case 'monochrome_decomposition_abstraction': return monochrome_decomposition_abstraction(decomposer.abstraction_name!, decomposer.decomposers!.map(build_decomposer));
        case 'simple_abstraction': return simple_abstraction(decomposer.abstraction_name!, build_decomposer(decomposer.decomposer!));

        case 'add_info': return add_info(build_decomposer(decomposer.decomposer!), build_decomposer(decomposer.decomposer2!));

        case 'alternatives': {
            const decomposers = decomposer.decomposers!.map(build_decomposer);

            return (grid: Grid) => {
                const alternatives: ConcreteImage[] = [];

                for (let i = 0; i < decomposers.length; i++) {
                    try {
                        alternatives.push(decomposers[i](grid));
                    } catch (_e) {
                        // deno-lint-ignore no-explicit-any
                        alternatives.push(undefined as any);
                        decomposer.decomposers![i].failed = true;
                    }
                }

                return new Alternatives(alternatives);
            }
        }

        default: throw new Error(`Unknown decomposer '${decomposer.name}'`);
    }    
}

export function decomposer_to_list(decomposer: Decomposer): string[] {
    if (decomposer.decomposer) {
        return [decomposer.name, ...decomposer_to_list(decomposer.decomposer)];
    } else {
        return [decomposer.name];
    }
}