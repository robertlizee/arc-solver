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
import { ConcreteImage } from "./ConcreteImage";
import { Transform } from "./Transform";

export interface Decomposer {
    name: string;
    decomposer?: Decomposer;
    decomposer2?: Decomposer;
    decomposers?: Decomposer[];
    transform?: Transform;
    background_color?: Color;
    abstraction_name?: string;
    fixed_size?: boolean;
    default_grid_color?: Color;
    sx?: number;
    sy?: number;
    nx?: number;
    ny?: number;
    failed?: boolean;
}

export function image_window(decomposer: Decomposer): Decomposer {
    return {
        name: 'image_window',
        decomposer
    };
}

export const basic_grid: Decomposer = { name: 'basic_grid' };


export function object_list(decomposer: Decomposer): Decomposer {
    return {
        name: 'object_list',
        decomposer
    };
}

export function object_list2(decomposer: Decomposer): Decomposer {
    return {
        name: 'object_list2',
        decomposer
    }
}

export function block_list(decomposer: Decomposer): Decomposer {
    return {
        name: 'block_list',
        decomposer
    };
}

export function scaled(decomposer: Decomposer): Decomposer {
    return {
        name: 'scaled',
        decomposer
    };
}

export function tile(decomposer: Decomposer): Decomposer {
    return {
        name: 'tile',
        decomposer
    }
}

export function tile_x(decomposer: Decomposer): Decomposer {
    return {
        name: 'tile_x',
        decomposer
    }
}

export function tile_y(decomposer: Decomposer): Decomposer {
    return {
        name: 'tile_y',
        decomposer
    }
}

export function transform(transform: Transform, decomposer: Decomposer): Decomposer {
    return {
        name: 'transform',
        transform,
        decomposer
    }
}


export const semantic_box: Decomposer = { name: 'semantic_box' };

export function trim_object(decomposer: Decomposer): Decomposer {
    return {
        name: 'trim_object',
        decomposer
    }
}

export function trim_object_center(decomposer: Decomposer): Decomposer {
    return {
        name: 'trim_object_center',
        decomposer
    }
}

export function monochrome(decomposer: Decomposer): Decomposer {
    return {
        name: 'monochrome',
        decomposer
    }
}

export const solid_color: Decomposer = { name: 'solid_color' };

export function background(background_color: Color | undefined, decomposer: Decomposer): Decomposer {
    return {
        name: 'background',
        background_color,
        decomposer
    }
}

export function color_decomposition(decomposer: Decomposer): Decomposer {
    return {
        name: 'color_decomposition',
        decomposer
    }
}

export function monochrome_object_list(decomposer: Decomposer): Decomposer {
    return {
        name: 'monochrome_object_list',
        decomposer
    }
}

export function monochrome_object_list_abstraction(abstraction_name: string, decomposers: Decomposer[]): Decomposer {
    return {
        name: 'monochrome_object_list_abstraction',
        abstraction_name,
        decomposers,
    }
}

export function monochrome_decomposition_abstraction(abstraction_name: string, decomposers: Decomposer[]): Decomposer {
    return {
        name: 'monochrome_decomposition_abstraction',
        abstraction_name,
        decomposers
    }
}

export function simple_abstraction(abstraction_name: string, decomposer: Decomposer): Decomposer {
    return {
        name: 'simple_abstraction',
        abstraction_name,
        decomposer
    }
}

export function monochrome_object_list2(decomposer: Decomposer): Decomposer {
    return {
        name: 'monochrome_object_list2',
        decomposer
    }
}

export function horizontal_decomposition(decomposer: Decomposer, fixed_size = false): Decomposer {
    return {
        name: 'horizontal_decomposition',
        fixed_size,
        decomposer
    }
}

export function complement(decomposer: Decomposer): Decomposer {
    return {
        name: 'complement',
        decomposer
    }
}

export function find_master_grid(decomposer: Decomposer, default_grid_color?: Color, fixed_size = false): Decomposer {
    return {
        name: 'find_master_grid',
        default_grid_color,
        fixed_size,
        decomposer
    }
}

export function master_grid(sx: number, sy: number, decomposer: Decomposer): Decomposer {
    return {
        name: 'master_grid',
        sx, sy,
        decomposer
    }
}

export function master_grid2(nx: number, ny: number, decomposer: Decomposer): Decomposer {
    return {
        name: 'master_grid2',
        nx,
        ny,
        decomposer
    }
}

export const pixel_grid: Decomposer = { name: 'pixel_grid' };

export function add_info(decomposer: Decomposer, decomposer2: Decomposer): Decomposer {
    return {
        name: 'add_info',
        decomposer,
        decomposer2
    }
}

export function centered(decomposer: Decomposer): Decomposer {
    return {
        name: 'centered',
        decomposer
    }
}

export function alternatives(decomposers: Decomposer[]): Decomposer {
    return {
        name: 'alternatives',
        decomposers
    }
}


export function normalize_decomposer(decomposer: Decomposer): Decomposer {
    if (decomposer.name === 'image_window' || decomposer.name === 'basic_grid') {
        return decomposer;
    } else {
        return image_window(decomposer);
    }
}

export function decomposer_to_key(decomposer?: Decomposer | Decomposer[]): string {
    if (decomposer instanceof Array) {
        return `[${decomposer.map(decomposer_to_key).join(',')}]`
    } else if (decomposer) {
        return `${decomposer.name}(${[
            decomposer.decomposer? decomposer_to_key(decomposer.decomposer) : "",
            decomposer.decomposer2? decomposer_to_key(decomposer.decomposer2) : "",
            decomposer.decomposers? `[${decomposer.decomposers.map(decomposer_to_key).join(',')}]` : "",
            decomposer.transform? decomposer.transform?.toString(): "",
            decomposer.background_color? decomposer.background_color.toString(): "",
            decomposer.fixed_size? decomposer.fixed_size? 'true': 'false' : "",
            decomposer.default_grid_color? decomposer.default_grid_color.toString(): "",
            decomposer.sx? decomposer.sx.toString(): "",
            decomposer.sy? decomposer.sy.toString(): "",
            decomposer.nx? decomposer.nx.toString(): "",
            decomposer.ny? decomposer.ny.toString(): ""
        ].filter(x => x !== "").join(',')})`;     
    } else {
        return "none";
    }
}

export const root_decomposers = new Set([
    'object_list',
    'object_list2',
    'block_list',
    'color_decomposition',
    'monochrome_object_list',
    'monochrome_object_list2',
    'horizontal_decomposition',
    'find_master_grid',
    'master_grid',
    'master_grid2',
    'monochrome_object_list_abstraction',
    'monochrome_decomposition_abstraction',
])

export function decomposer_clone(decomposer: Decomposer): Decomposer {
    return { ...decomposer, 
        decomposer: decomposer.decomposer? decomposer_clone(decomposer.decomposer) : undefined,
        decomposer2: decomposer.decomposer2? decomposer_clone(decomposer.decomposer2) : undefined,
        decomposers: decomposer.decomposers? decomposer.decomposers.map(decomposer_clone) : undefined,
        failed: false
    }
}

export function decomposer_remove_failed_alternatives(decomposer: Decomposer): Decomposer {
    if (decomposer.name === 'alternatives') {
        return alternatives(decomposer.decomposers!.filter(decomposer => !decomposer.failed).map(decomposer_remove_failed_alternatives));
    } else {
        return { ...decomposer,
            decomposer: decomposer.decomposer? decomposer_remove_failed_alternatives(decomposer.decomposer) : undefined,
            decomposer2: decomposer.decomposer2? decomposer_remove_failed_alternatives(decomposer.decomposer2) : undefined,
            decomposers: decomposer.decomposers? decomposer.decomposers.map(decomposer_remove_failed_alternatives) : undefined,
            failed: false    
        }
    }     
}

function _decomposer_prefix(decomposer: Decomposer): Decomposer | undefined {
    if (root_decomposers.has(decomposer.name)) {
        return undefined;
    } else {
        return { ...decomposer, 
            decomposer: decomposer.decomposer? _decomposer_prefix(decomposer.decomposer) : undefined,
            decomposer2: decomposer.decomposer2? decomposer_clone(decomposer.decomposer2) : undefined,
            decomposers: decomposer.decomposers? decomposer.decomposers.map(decomposer_clone) : undefined,
            failed: false
        }    
    }
}

export function decomposer_prefix(decomposer: Decomposer): Decomposer | undefined {
    if (decomposer_root(decomposer)) {
        return _decomposer_prefix(decomposer);
    }
}

export function decomposer_root(decomposer: Decomposer): Decomposer | undefined {
    if (root_decomposers.has(decomposer.name)) {
        return { ...decomposer, decomposer: undefined, decomposers: undefined, failed: false };
    } else if (decomposer.decomposer) {
        return decomposer_root(decomposer.decomposer);
    }    
}

export function decomposer_suffix(decomposer: Decomposer): Decomposer | Decomposer[] | undefined {
    if (root_decomposers.has(decomposer.name)) {
        if (decomposer.decomposer) {
            return decomposer_clone(decomposer.decomposer)
        } else if (decomposer.decomposers) {
            return decomposer.decomposers.map(decomposer_clone);
        }
    } else if (decomposer.decomposer) {
        return decomposer_suffix(decomposer.decomposer);
    }    
}

