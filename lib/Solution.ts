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
import { image_window,color_decomposition,centered,find_master_grid,object_list,monochrome,add_info,basic_grid,complement,background,master_grid,trim_object,monochrome_object_list,object_list2,solid_color,pixel_grid, monochrome_object_list2, master_grid2, horizontal_decomposition, block_list, scaled, semantic_box, tile, tile_x, tile_y, transform, monochrome_object_list_abstraction, monochrome_decomposition_abstraction, trim_object_center, simple_abstraction, Decomposer, normalize_decomposer } from "./DecomposersData";
import { Grid } from "./Grid";
import { select,selects,highest,highests,lowest,lowests,count_items } from "./Misc";
import { ConcreteImage,ImageTransformation,Scale,make_object_list,make_image_window,set_background,SolidColor,make_rotation,BackgroundColor,Concentric,SubImages,Pixel,Procedural } from "./ConcreteImage";
import { Transform } from "./Transform";
import { build_decomposer } from "./Decomposers";
import { log } from "./Logger";

/*export function solution<I1 extends ConcreteImage, I2 extends ConcreteImage>(decomposer: (grid: Grid) => I1, transform: (image: I1) => I2): { solver: (grid: Grid) => Grid } {
    return {
        solver: grid => transform(decomposer(grid)).compile().generate_grid()
    };
}

export function solution2<I1 extends ConcreteImage, I2 extends ConcreteImage, I3 extends ConcreteImage>(decomposer_input: (grid: Grid) => I1, decomposer_output: (grid: Grid) => I2, transform?: (image: I1) => I3): { 
        solver?: (grid: Grid) => Grid; 
        decomposer_input: (grid: Grid) => I1; 
        decomposer_output: (grid: Grid) => I2 
} {
    return {
        solver: transform? grid => transform(decomposer_input(grid)).compile().generate_grid() : undefined,
        decomposer_input,
        decomposer_output,
    };
}

export function rasterize<I extends ConcreteImage>(decomposer: (grid: Grid) => I) {
    return {
        rasterizer: true,
        decomposer_input: decomposer
    }
}*/

export function solution(decomposer: Decomposer, transform: (image: ConcreteImage) => ConcreteImage): { solver: (grid: Grid) => Grid } {
    const fdecomposer = build_decomposer(decomposer);
    return {
        solver: grid => transform(fdecomposer(grid)).compile().generate_grid()
    };
}

export function solution2(decomposer_input: Decomposer, decomposer_output: Decomposer, transform?: (image: ConcreteImage) => ConcreteImage): { 
        solver?: (grid: Grid) => Grid; 
        decomposer_input: (grid: Grid) => ConcreteImage; 
        decomposer_output: (grid: Grid) => ConcreteImage;
        decomposer_input_data: Decomposer;
        decomposer_output_data: Decomposer;
} {
    //decomposer_input = normalize_decomposer(decomposer_input);
    //decomposer_output = normalize_decomposer(decomposer_output);
    const fdecomposer_input = build_decomposer(decomposer_input);
    const fdecomposer_output = build_decomposer(decomposer_output);
    return {
        solver: transform? grid => transform(fdecomposer_input(grid)).compile().generate_grid() : undefined,
        decomposer_input: fdecomposer_input,
        decomposer_output: fdecomposer_output,
        decomposer_input_data: decomposer_input,
        decomposer_output_data: decomposer_output,
    };
}

export function rasterize(decomposer: Decomposer) {
    const fdecomposer = build_decomposer(decomposer)
    return {
        rasterizer: true,
        decomposer_input: fdecomposer
    }
}

rasterize(basic_grid);
solution(image_window(color_decomposition(centered(find_master_grid(object_list(monochrome(add_info(basic_grid, complement(simple_abstraction('test', semantic_box))))))))),
    // deno-lint-ignore no-explicit-any
    grid => new ImageTransformation(Transform.rotate_180, new Scale(select(selects([1,2,3], _x => true), _x => true)! + highest(highests([1, 2, 3], x => x), x => x)! + lowest(lowests([1, 2, 3], x => x), x => x)!, make_object_list((grid as any).image.list.map((_obj: any) => make_image_window(set_background(Color.red, new SolidColor(Color.red))))))));
solution(background(Color.blue, block_list(image_window(master_grid(2, 2, horizontal_decomposition(trim_object(tile(tile_x(tile_y(transform(Transform.flip_x, monochrome_object_list(object_list2(monochrome_object_list_abstraction('test', [monochrome_object_list2(monochrome(scaled(master_grid2(2, 2, monochrome_decomposition_abstraction('test', [trim_object_center(solid_color)])))))]))))))))))))),
    _grid => make_rotation(new BackgroundColor(Color.blue, new Concentric(new SubImages([new Pixel, new Procedural((_x, _y) => Color.red)], 'free')))));
solution2(solid_color, pixel_grid, i => i);
log(count_items([1, 2, 3]));


export function evaluate_solver(code: string): { 
    solver: (grid: Grid) => Grid, 
    rasterizer?: boolean,
    decomposer_input?: (grid: Grid) => ConcreteImage, 
    decomposer_output?: (grid: Grid) => ConcreteImage,
    decomposer_input_data: Decomposer,
    decomposer_output_data: Decomposer
} {
    try {
        return eval(code);
    } catch (e) {
        log(code);
        console.error(e);
        
        // deno-lint-ignore no-explicit-any
        return 'error' as any;
    }
}
