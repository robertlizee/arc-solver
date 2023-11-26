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

import { Color, identity_color_mapping } from "./Color";
import { fbasic_grid as basic_grid } from "./Decomposers";
import { Grid } from "./Grid";
import { append_vectors, count } from "./Misc";
import { image_function, prefix, color_function, grid_function, number_function, prefix_list } from "./Solver";
import { CantBuildNumberFunction, F, ImageFunction, PathFunction, Solver } from "./Solver";
import { Transform } from "./Transform";
import { SymbolicImage } from "./SymbolicImage"
import { log } from "./Logger";

export class ImageCompilation {

    constructor(public x0: number, public y0: number, public x1: number, public y1: number, public at: (x: number, y: number) => Color) {

    }    

    generate_grid(): Grid {
        const width = this.x1 - this.x0;
        const height = this.y1 - this.y0;
        const grid = new Grid(width, height);

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                grid.set(x, y, this.at(this.x0 + x + 0.5, this.y0 + y + 0.5));
            }
        }

        return grid;
    }
}

export class ConcreteImage extends SymbolicImage {
    // deno-lint-ignore no-explicit-any
    protected update_func?: (x: any) => void;
    protected insert_before_func?: (image: ConcreteImage) => ConcreteImage;
    protected do_delete = false;

    private builders?: { [key: string]: string | string[] };

    constructor() {
        super();
    }

    set_builders(builders: { [key: string]: string | string[] } ) {
        this.builders = builders;
        return this;
    }

    get_type(): string {
        throw new Error("Needs to be implemented in derived class!");
    }

    clone(): this {
        throw 'base-class-not-defined';
    }

    get key(): string {
        throw 'base-class-not-defined';
    }

    translate(_dx: number, _dy: number): ConcreteImage {
        throw 'base-class-not-defined';
    }

    compile(): ImageCompilation {
        throw 'base-class-not-defined';
    }

    async build_solver_function(_solver: Solver, _path: PathFunction): Promise<ImageFunction<SymbolicImage, ConcreteImage>> {
        throw new Error('Not impemented in derived class');
    }

    to_grid() {
        return this.compile().generate_grid();
    }

    *images(): Generator<ConcreteImage> {
    }

    *recur_images(): Generator<ConcreteImage> {
        yield this;

        for (const sub_image of this.images()) {
            for (const sub_image2 of sub_image.recur_images()) {
                yield sub_image2;
            }
        }
    }
}

export class BasicImage extends ConcreteImage {
    grid: Grid;
    holes_count: number;
    symmetrical_x: number;

    constructor(public list: Color[], public stride: number) {
        super();
        this.grid = this.to_grid();
        this.holes_count = [...this.grid.map_colors((c: Color) => c === Color.black? Color.true : Color.false).foreach_object(false)]
            .filter(grid => grid.count_perimeter(color => color === Color.true) === 0).length;
        this.symmetrical_x = this.grid.symmetrical(Transform.flip_x)? 1: 0;
    }

    get key(): string {
        return `BasicImage([${this.list.map(i => i.toString()).join(',')}], ${this.stride})`;
    }

    get_type(): string {
        return 'BasicImage';
    }

    clone(): this {
        return new BasicImage([...this.list], this.stride) as this;
    }

    translate(dx: number, dy: number): ConcreteImage {
        return new Translation(dx, dy, this.clone());       
    }

    compile(): ImageCompilation {
        const x0 = 0;
        const y0 = 0;
        const x1 = Math.floor(this.stride);
        const y1 = Math.ceil(this.list.length / this.stride)
        return new ImageCompilation(x0, y0, x1, y1, (x, y) => {
                if (x >= x0 && x < x1 && y >= y0 && y < y1) {
                    return this.list[Math.floor(y) * this.stride + Math.floor(x)];
                } else {
                    return Color.black;
                }
            }                    
        );
    }

    get width() { return this.stride }
    get area() { return this.list.length }
    get height() { return this.list.length / this.stride }
    get non_black() { return count(this.list, (c: Color) => c !== Color.black)}
    get nb_colors() { return new Set(this.list).size }

    number_functions() {
        return [
            ...['area', 'width', 'height', 'non_black', 'touching_perimeter', 'symmetrical_x', 'nb_colors', 'holes_count'].map(number_function),
            ...identity_color_mapping.map((color: Color) => F.make(Color[color], (image: BasicImage) => count(image.list, (c: Color) => c === color)))
        ];
    }

    get touching_perimeter() {
        for (let i = 0; i < this.stride; i++) {
            if (this.list[i] !== Color.black || this.list[this.list.length - i - 1] !== Color.black) {
                return 1;
            }
        }
        for (let j = 0; j < this.list.length; j += this.stride) {
            if (this.list[j] !== Color.black || this.list[j + this.stride - 1] !== Color.black) {
                return 1;
            }
        }

        return 0;
    }

    color_functions() {
        return [];
    }

    grid_functions() {
        return [grid_function('grid')];
    }

    async build_solver_function(solver: Solver, path: PathFunction): Promise<ImageFunction<SymbolicImage, ConcreteImage>> {
        log('BasicGrid.build_solver_internal');
        const the_grid_function = await solver.build_grid_function(grid_function('grid').prefix(path));
        return (image, ...indices) => basic_grid(the_grid_function.f(image, ...indices)!).set_builders({ grid: the_grid_function.path });
    }

    *grids() {
        yield this.to_grid();
    }
}

export class SemanticBox extends ConcreteImage {
    constructor(public width: number, public height: number, public list: Color[]) {
        super();
    }

    get key(): string {
        return `SemanticBox(${this.width}, ${this.height}, [${this.list.map(i => i.toString()).join(',')}])`
    }

    get area() {
        return this.width * this.height;
    }

    get_type(): string {
        return "SemanticBox";
    }

    clone(): this {
        return new SemanticBox(this.width, this.height, [...this.list]) as this;
    }

    translate(dx: number, dy: number): ConcreteImage {
        return new Translation(dx, dy, this.clone());       
    }

    compile(): ImageCompilation {
        const w = this.width;
        const h = this.height;
        const l = this.list;
        return new ImageCompilation(0, 0, w, h, (x, y) => {
                if (x >= 0 && x < w && y >= 0 && y < h) {
                    if (x < 1) {
                        if (y < 1) {
                            return l[0];
                        } else if (y < h-1) {
                            return l[3];
                        } else {
                            return l[6];
                        }
                    } else if (x < w-1) {
                        if (y < 1) {
                            return l[1];
                        } else if (y < h-1) {
                            return l[4];
                        } else {
                            return l[7];
                        }
                    } else {
                        if (y < 1) {
                            return l[2];
                        } else if (y < h-1) {
                            return l[5];
                        } else {
                            return l[8];
                        }
                    }
                } else {
                    return Color.black;
                }
            }                    
        );
    }

    number_functions() {
        return ['area', 'width', 'height'].map(number_function);
    }

    get c0() { return this.list[0] } 
    get c1() { return this.list[1] } 
    get c2() { return this.list[2] } 
    get c3() { return this.list[3] } 
    get c4() { return this.list[4] } 
    get c5() { return this.list[5] } 
    get c6() { return this.list[6] } 
    get c7() { return this.list[7] } 
    get c8() { return this.list[8] } 

    color_functions() {
        return this.list.map((_c, i) => color_function(`c${i}`));
    }

    async build_solver_function(solver: Solver, path: PathFunction): Promise<ImageFunction<SymbolicImage, ConcreteImage>> {
        log('SemanticBox.build_solver_internal');
        const width_function = await solver.build_number_function(number_function('width').prefix(path));
        const height_function = await solver.build_number_function(number_function('height').prefix(path));
        const list_functions = await Promise.all(this.list.map((_c, i) => solver.build_color_function(color_function(`c${i}`).prefix(path))));
    
        return (image, ...indices) => new SemanticBox(
                width_function.f(image, ...indices)!, 
                height_function.f(image, ...indices)!, 
                list_functions.map(f => f.f(image, ...indices)!))
            .set_builders({ width: width_function.path, height: height_function.path, list: list_functions.map(x => x.path) });
    }
}

export class MonochromeColor<I extends ConcreteImage> extends ConcreteImage {
    constructor(public color: Color, public image: I) {
        super();
    }
    
    get key(): string {
        return `MonoChromeColor(${this.color}, ${this.image.key})`;
    }

    get_type(): string {
        return `MonochromeColor<${this.image.get_type()}>`;
    }

    clone(): this {
        return new MonochromeColor(this.color, this.image.clone()) as this;
    }

    translate(dx: number, dy: number): ConcreteImage {
        return new MonochromeColor(this.color, this.image.translate(dx, dy));        
    }

    compile(): ImageCompilation {
        const child = this.image.compile();
        
        return new ImageCompilation(child.x0, child.y0, child.x1, child.y1, (x, y) => {
            const color = child.at(x, y);
            return color !== Color.black ? this.color : Color.black;
        });
    }

    number_functions() {
        return this.image.number_functions().map(prefix('image'));
    }

    color_functions() {
        return [
            color_function('color'),
            ...this.image.color_functions().map(prefix('image'))
        ];
    }

    grid_functions() {
        return this.image.grid_functions().map(prefix('image'));
    }

    sub_images_functions() {
        return this.image.sub_images_functions().map(prefix('image'));
    }

    async build_solver_function(solver: Solver, path: PathFunction): Promise<ImageFunction<SymbolicImage, ConcreteImage>> {
        log('MonochromeColor.build_solver_internal');

        const the_color_function = await solver.build_color_function(color_function('color').prefix(path));
        const the_image_function = await this.image.build_solver_function(solver, image_function('image').prefix(path));

        return (image, ...indices) => new MonochromeColor(the_color_function.f(image, ...indices)!, the_image_function(image, ...indices))
            .set_builders({ color: the_color_function.path });
    }

    *grids() {
        for (const grid of this.image.grids()) {
            yield grid;
        }
    }

    *images() {
        yield this.image;
    }
}


export class Alternatives extends ConcreteImage {
    constructor(public alternatives: ConcreteImage[]) {
        super();
    }

    get key(): string {
        return `Alternatives([${this.alternatives.map(alternative => alternative.key).join(',')}])`;
    }

    get_type(): string {
        return `Alternatives<${this.alternatives.map(alternative => alternative.get_type()).join(',')}>`;
    }

    clone(): this {
        return new Alternatives(this.alternatives.map(alternative => alternative.clone())) as this;
    }

    translate(dx: number, dy: number): ConcreteImage {
        return new Alternatives(this.alternatives.map(alternative => alternative.translate(dx, dy)));        
    }

    compile(): ImageCompilation {
        return this.alternatives[0].compile();
    }

    number_functions() {
        return append_vectors(...this.alternatives.map((alternative, i) => alternative.number_functions().map(prefix_list('alternatives', i))));
    }

    color_functions() {
        return append_vectors(...this.alternatives.map((alternative, i) => alternative.color_functions().map(prefix_list('alternatives', i))));
    }

    grid_functions() {
        return append_vectors(...this.alternatives.map((alternative, i) => alternative.grid_functions().map(prefix_list('alternatives', i))));
    }

    sub_images_functions() {
        return append_vectors(...this.alternatives.map((alternative, i) => alternative.sub_images_functions().map(prefix_list('alternatives', i))));
    }

    async build_solver_function(solver: Solver, path: PathFunction): Promise<ImageFunction<SymbolicImage, ConcreteImage>> {
        log('Alternatives.build_solver_internal');

        for (let i = 0; i < this.alternatives.length; i++) {
            const alternative = this.alternatives[i];

            try {
                return alternative.build_solver_function(solver, F.make(`alternatives[${i}]`, (image: Alternatives) => image.alternatives[i]).prefix(path));
            } catch (_e) {
                //
            }
        }

        throw new Error("Can't build alternatives");
    }

    *grids() {
        for (const grid of append_vectors(...this.alternatives.map(alternative => [...alternative.grids()]))) {
            yield grid;
        }
    }

    *images() {
        for (const alternative of this.alternatives) {
            yield alternative;
        }
    }
}


export class ImageData<I extends ConcreteImage> extends ConcreteImage {
    constructor(public data: number[], public image: I) {
        super();
    }

    get key(): string {
        return `ImageData([${this.data.map(i => i.toString()).join(',')}])`;
    }

    get_type(): string {
        return `ImageData<${this.image.get_type()}>`;
    }

    clone(): this {
        return new ImageData(this.data, this.image.clone()) as this;
    }

    translate(dx: number, dy: number): ConcreteImage {
        return new ImageData(this.data, this.image.translate(dx, dy));
    }

    compile(): ImageCompilation {
        return this.image.compile();
    }

    number_functions() {
        return [
            ...this.data.map((_value, index) => F.make(`data${index}`, (image: ImageData<I>) => image.data[index])),
            ...this.image.number_functions().map(prefix('image'))
        ];
    }

    color_functions() {
        return this.image.color_functions().map(prefix('image'));
    }

    grid_functions() {
        return this.image.grid_functions().map(prefix('image'));
    }

    sub_images_functions() {
        return this.image.sub_images_functions().map(prefix('image'));
    }

    async build_solver_function(solver: Solver, path: PathFunction): Promise<ImageFunction<SymbolicImage, ConcreteImage>> {
        const solver_function = this.image.build_solver_function(solver, image_function('image').prefix(path));
        return solver_function;
    }

    *grids() {
        for (const grid of this.image.grids()) {
            yield grid;
        }
    }

    *images() {
        yield this.image;
    }
}


export class BackgroundColor<I extends ConcreteImage> extends ConcreteImage {
    constructor(public background_color: Color, public image: I) {
        super();
    }

    get key(): string {
        return `BackgroundColor(${this.background_color}, ${this.image.key})`;
    }

    get_type(): string {
        return `BackgroundColor<${this.image.get_type()}>`;
    }

    clone(): this {
        return new BackgroundColor(this.background_color, this.image.clone()) as this;
    }

    translate(dx: number, dy: number): ConcreteImage {
        return new BackgroundColor(this.background_color, this.image.translate(dx, dy));        
    }

    compile(): ImageCompilation {
        const child = this.image.compile();

        return new ImageCompilation(child.x0, child.y0, child.x1, child.y1, (x, y) => {
            const color = child.at(x, y);
            return color === this.background_color? Color.black : color === Color.black? this.background_color : color;
        });
    }

    number_functions() {
        return this.image.number_functions().map(prefix('image'));
    }

    color_functions() {
        return [
            color_function('background_color'),
            ...this.image.color_functions().map(prefix('image'))
        ];
    }

    grid_functions() {
        return this.image.grid_functions().map(prefix('image'));
    }

    sub_images_functions() {
        return this.image.sub_images_functions().map(prefix('image'));
    }

    async build_solver_function(solver: Solver, path: PathFunction): Promise<ImageFunction<SymbolicImage, ConcreteImage>> {
        log('BackgroundColor.build_solver_internal');

        const the_color_function = await solver.build_color_function(color_function('background_color').prefix(path));
        const the_image_function = await this.image.build_solver_function(solver, image_function('image').prefix(path))
                
        return (image, ...indices) => new BackgroundColor(the_color_function.f(image, ...indices)!, the_image_function(image, ...indices))
            .set_builders({ color: the_color_function.path });
    }

    *grids() {
        for (const grid of this.image.grids()) {
            yield grid;
        }
    }

    *images() {
        yield this.image;
    }
}

export class SubImages<I extends ConcreteImage> extends ConcreteImage {

    constructor(public list: I[], public stride: number | 'free' | 'xor' | 'and', public grid_color = Color.black, public fixed_size = false) {
        super();

        if (list.length > 30) {
            throw new Error('Too many sub objects');
        }
    }

    get key(): string {
        const subimages = this.list.map(subimage => subimage.key);
        subimages.sort();
        return `SubImage([${subimages.join(',')}])`;
    }

    get_type(): string {
        return `Subimages<${this.list[0].get_type()},${typeof(this.stride) === 'number'? 'number' : this.stride}${this.fixed_size?',fixed_size': ''}>`;
    }

    clone(): this {
        return new SubImages(this.list.map(image => image.clone()), this.stride, this.grid_color, this.fixed_size) as this;
    }

    translate(dx: number, dy: number): ConcreteImage {
        return new SubImages(this.list.map(image => image.translate(dx, dy)), this.stride, this.grid_color, this.fixed_size) as this;        
    }

    compile(): ImageCompilation {
        const children = this.list.map(child_image => child_image.compile());
        const x0 = Math.min(...children.map(child => child.x0));
        const x1 = Math.max(...children.map(child => child.x1));
        const y0 = Math.min(...children.map(child => child.y0));
        const y1 = Math.max(...children.map(child => child.y1));
        const at = 
            this.stride === 'xor'? (x: number, y: number) => {
                let value = Color.black;
                for (const child of children) {
                    const new_value = child.at(x, y);
                    if (value === Color.black) {
                        value = new_value;
                    } else if (new_value !== Color.black) {
                        value = Color.black;
                    }
                }
                return value;
            }
            : this.stride === 'and'? (x: number, y: number) => {
                let value = Color.true;
                for (const child of children) {
                    const new_value = child.at(x, y);
                    if (value === Color.black || new_value === Color.black) {
                        value = Color.black;
                    } else {
                        value = new_value;
                    }
                }
                return value;
            }
            : (x: number, y: number) => {
                let hit = false;
                for (const child of children) {
                    if (x >= child.x0 && x < child.x1 && y >= child.y0 && y < child.y1) {
                        hit = true;
                        const color = child.at(x, y);
                        if (color !== Color.black) {
                            return color;
                        }
                    }
                }
                if (hit) {
                    return Color.black;
                } else {
                    return this.grid_color;
                }
            };

        return new ImageCompilation(x0, y0, x1, y1, at);
    }

    get count() { return this.list.length }

    number_functions() {
        if (this.fixed_size) {
            return append_vectors([number_function('count')],
                ...this.list.map((sub_image, i) => sub_image.number_functions().map(prefix_list('list', i))));
        } else {
            return [number_function('count')];
        }
    }

    color_functions() {
        if (this.fixed_size) {
            return append_vectors([color_function('grid_color')],
                ...this.list.map((sub_image, i) => sub_image.color_functions().map(prefix_list('list', i))));
        } else {
            return [color_function('grid_color')];
        }
    }

    grid_functions() {
        if (this.fixed_size) {
            return append_vectors(...this.list.map((sub_image, i) => sub_image.grid_functions().map(prefix_list('list', i))));
        } else {
            return [];
        }
    }


    sub_images_functions() {
        return [F.make('list', (image: SubImages<I>) => image.list)];
    }

    async build_solver_function(solver: Solver, path: PathFunction): Promise<ImageFunction<SymbolicImage, ConcreteImage>> {
        log('SubImages.build_solver_internal');

        //if (!this.fixed_size) 
        {
            for await (const { sub_solver, boolean_function, length_function } of solver.find_mapping_sub_solvers(F.make<ConcreteImage[], SymbolicImage>('list').prefix(path).f)) {
                const generation = sub_solver.generation - 1;
                try {
                    const the_color_function = await solver.build_color_function(color_function('grid_color').prefix(path));
                    const sub_image_builder = await this.list[0].build_solver_function(sub_solver, 
                        F.make(`list[i${generation}]`, (image: SubImages<I>, ...indices: number[]) => image.list[indices[generation]]).prefix(path));
                    log('SubImages.build_solver_internal success');
                    return (image, ...indices) => {
                        const sub_images: ConcreteImage[] = [];
    
                        const n = length_function.f(image, ...indices);
                        //log(`length_function returns ${n}`);
    
                        for (let i = 0; i < n; i++) {
                            const new_indices = [...indices];
                            new_indices[generation] = i;
                            if (boolean_function.f(image, ...new_indices)) {
                                //log("boolean is true");
                                sub_images.push(sub_image_builder(image, ...new_indices));
                            } else {
                                //log("boolean is false");
                            }
                        }
        
                        return new SubImages(sub_images, this.stride, the_color_function.f!(image, ...indices)).set_builders({ color: the_color_function.path, descriminator: boolean_function.path });
    
                    };
                } catch (_e) {
                    // no need to do anything
                }
            }    
        }

        log('SubImages.build_solver_internal type 2');

        if (solver.is_constant_output(number_function('count'))
                && this.list.length <= 10) 
        {
            try {
                const sub_images_function = await Promise.all(this.list.map((sub_image, i) => sub_image.build_solver_function(solver, F.make(`list${i}`, (image: SubImages<I>) => image.list[i]).prefix(path))));
                const the_color_function = await solver.select_color_function(color_function('grid_color').prefix(path));
                if (the_color_function && sub_images_function.length === sub_images_function.filter(f => f !== undefined).length && color_function !== undefined) {
                    log('SubImages.build_solver_internal type 2 success');
                    return (image:SymbolicImage, ...indices) => new SubImages(sub_images_function.map(f => f(image, ...indices)!), this.stride, the_color_function.f(image, ...indices));
                }    
            } catch (_e) {
                    // no need to do anything
            }
        }

        throw new Error("Can't build solver");
    }

    *grids() {
        for (const elem of this.list) {
            for (const grid of elem.grids()) {
                yield grid;
            }    
        }
    }

    *images() {
        for (const image of this.list) {
            yield image;
        }
    }
}

export class ImageWindow<I extends ConcreteImage> extends ConcreteImage {
    constructor(public x0: number, public y0: number, public x1: number, public y1: number, public image: I) {
        super();
    }

    get key(): string {
        return `ImageWindow(${this.x0}, ${this.y0}, ${this.x1}, ${this.y1}, ${this.image.key})`;
    }

    get_type(): string {
        return `ImageWindow<${this.image.get_type()}>`;
    }

    clone(): this {
        return new ImageWindow(this.x0, this.y0, this.x1, this.y1, this.image.clone()) as this;
    }

    translate(dx: number, dy: number): ConcreteImage {
        return new ImageWindow(this.x0+dx, this.y0+dy, this.x1+dx, this.y1+dy, this.image.translate(dx, dy)) as this;        
    }

    compile(): ImageCompilation {
        const child = this.image.compile();
        
        return new ImageCompilation(this.x0, this.y0, this.x1, this.y1,
            (x, y) => x < this.x0 || x >= this.x1 || y < this.y0 || y >= this.y1? Color.black : child.at(x, y)
        );
    }

    get width() { return this.x1 - this.x0; }
    get height() { return this.y1 - this.y0; }
    get area() { return (this.x1 - this.x0) * (this.y1 - this.y0); }

    number_functions() {
        return [...['x0', 'x1', 'width', 'y0', 'y1', 'height', 'area'].map(number_function), 
            ...this.image.number_functions().map(prefix('image'))
        ];
    }

    color_functions() {
        return this.image.color_functions().map(prefix('image'));
    }

    grid_functions() {
        return this.image.grid_functions().map(prefix('image'));
    }

    sub_images_functions() {
        return this.image.sub_images_functions().map(prefix('image'));
    }

    async build_solver_function(solver: Solver, path: PathFunction): Promise<ImageFunction<SymbolicImage, ConcreteImage>> {
        log('ImageWindow.build_solver_internal');

        const _x0_function = await solver.select_number_function(number_function('x0').prefix(path));
        const _x1_function = await solver.select_number_function(number_function('x1').prefix(path));
        const _y0_function = await solver.select_number_function(number_function('y0').prefix(path));
        const _y1_function = await solver.select_number_function(number_function('y1').prefix(path));
        const width_function = await solver.select_number_function(number_function('width').prefix(path));
        const height_function = await solver.select_number_function(number_function('height').prefix(path));
        
        const x0_function = _x0_function? _x0_function 
            : _x1_function && width_function? F.minus(_x1_function, width_function)
            : undefined;
        const y0_function = _y0_function? _y0_function 
            : _y1_function && height_function? F.minus(_y1_function, height_function) 
            : undefined;
        const x1_function = _x1_function? _x1_function 
            : _x0_function && width_function? F.plus(_x0_function, width_function) 
            : undefined;
        const y1_function = _y1_function? _y1_function 
            : _y0_function && height_function? F.plus(_y0_function, height_function) 
            : undefined;

        if (x0_function && x1_function && y0_function && y1_function) {
            const the_image_function = await this.image.build_solver_function(solver, image_function('image').prefix(path));
            return (image: SymbolicImage, ...indices) => new ImageWindow(
                    x0_function.f(image, ...indices)!, 
                    y0_function.f(image, ...indices)!, 
                    x1_function.f(image, ...indices)!, 
                    y1_function.f(image, ...indices)!, 
                    the_image_function(image, ...indices)!)
                .set_builders({ x0: x0_function.path, y0: y0_function.path, x1: x1_function.path, y1: y1_function.path });
        } else if (!width_function && (!x0_function || !x1_function)) {
            throw new CantBuildNumberFunction(number_function('width').prefix(path));
        } else if (!x0_function) {
            throw new CantBuildNumberFunction(number_function('x0').prefix(path));
        } else if (!height_function && (!y0_function || !y1_function)) {
            throw new CantBuildNumberFunction(number_function('height').prefix(path));
        } else {
            throw new CantBuildNumberFunction(number_function('y0').prefix(path));
        }
    }

    *grids() {
        for (const grid of this.image.grids()) {
            yield grid;
        }
    }

    *images() {
        yield this.image;
    }
}

export class Scale<I extends ConcreteImage> extends ConcreteImage {
    constructor(public scale: number, public image: I, public grid_color = Color.no_color) {
        super();
    }

    get key(): string {
        return `Scale(${this.scale}, ${this.grid_color}, ${this.image.key})`;
    }

    get_type(): string {
        return `Scale<${this.image.get_type()}>`;
    }

    clone(): this {
        return new Scale(this.scale, this.image.clone(), this.grid_color) as this;
    }

    translate(dx: number, dy: number): ConcreteImage {
        return new Scale(this.scale, this.image.translate(dx/this.scale, dy/this.scale), this.grid_color) as this;        
    }

    compile(): ImageCompilation {
        const child = this.image.compile();
        
        if (this.grid_color === Color.no_color) {
            return new ImageCompilation(child.x0, child.y0, child.x0 + this.scale * (child.x1-child.x0), child.y0 + this.scale * (child.y1-child.y0),
                (x, y) => child.at(child.x0 + Math.floor((x-child.x0)/this.scale), child.y0 + Math.floor((y-child.y0) / this.scale))
            );    
        } else {
            const width = this.scale * (child.x1 - child.x0) + child.x1 - child.x0 - 1;
            const height = this.scale * (child.y1 - child.y0) + child.y1 - child.y0 - 1;
            return new ImageCompilation(child.x0, child.y0, child.x0 + width, child.y0 + height,
            (x, y) => {
                if (x >= child.x0 && y >= child.y0 && x < child.x0 + width && y < child.y0 + height) {
                    if (Math.floor(x - child.x0) % (this.scale + 1) === this.scale || Math.floor(y - child.y0) % (this.scale + 1) === this.scale) {
                        return this.grid_color;
                    } else {
                        return child.at(child.x0 + Math.floor((x-child.x0)/(this.scale+1)), child.y0 + Math.floor((y-child.y0) / (this.scale+1)))
                    }
                } else {
                    return Color.black
                }
            }
        );    

        }
    }
    
    number_functions() {
        return [
            number_function('scale'),
            ...this.image.number_functions().map(prefix('image'))
        ];
    }

    color_functions() {
        return [
            color_function('grid_color'), 
            ...this.image.color_functions().map(prefix('image'))
        ];
    }

    grid_functions() {
        return this.image.grid_functions().map(prefix('image'));
    }

    sub_images_functions() {
        return this.image.sub_images_functions().map(prefix('image'));
    }
    
    async build_solver_function(solver: Solver, path: PathFunction): Promise<ImageFunction<SymbolicImage, ConcreteImage>> {
        log('Scale.build_solver_internal');
        const scale_function = await solver.build_number_function(number_function('scale').prefix(path));
        const grid_color_function = await solver.build_color_function(color_function('grid_color').prefix(path));
        const the_image_function = await this.image.build_solver_function(solver, image_function('image').prefix(path));
        return (image: SymbolicImage, ...indices) => new Scale(
            scale_function.f(image, ...indices)!, 
            the_image_function(image, ...indices)!, 
            grid_color_function.f(image, ...indices)!)
        .set_builders({ scale: scale_function.path, grid: grid_color_function.path });
    }

    *grids() {
        for (const grid of this.image.grids()) {
            yield grid;
        }
    }

    *images() {
        yield this.image;
    }
}

export type AnchorType = 0 | 1 | 'center' | 'zero';
export class Translation<I extends ConcreteImage> extends ConcreteImage {
    x: number;
    y: number;
    x0: number;
    y0: number;
    x1: number;
    y1: number;

    constructor(x: number, y: number, public image: I, anchor_x: AnchorType = 'zero', anchor_y: AnchorType = 'zero') {
        super();
        const child = this.image.compile();

        switch (anchor_x) {
            case 0:
                this.x0 = x;
                this.x = this.x0 - child.x0;
                this.x1 = this.x + child.x1;
                break;
            case 1:
                this.x1 = x;
                this.x = this.x1 - child.x1;
                this.x0 = this.x + child.x0;
                break;
            case 'zero':
                this.x = x;
                this.x0 = this.x + child.x0;
                this.x1 = this.x + child.x1;
                break;
            case 'center':
                this.x0 = x - 0.5 * (child.x0 + child.x1)                
                this.x = this.x0 - child.x0;
                this.x1 = this.x + child.x1;
                break;
        }

        switch (anchor_y) {
            case 0:
                this.y0 = y;
                this.y = this.y0 - child.y0;
                this.y1 = this.y + child.y1;
                break;
            case 1:
                this.y1 = y;
                this.y = this.y1 - child.y1;
                this.y0 = this.y + child.y0;
                break;
            case 'zero':
                this.y = y;
                this.y0 = this.y + child.y0;
                this.y1 = this.y + child.y1;
                break;
            case 'center':
                this.y0 = x - 0.5 * (child.y0 + child.y1)                
                this.y = this.y0 - child.y0;
                this.y1 = this.y + child.y1;
                break;
        }
    }

    get key(): string {
        return `Translation(${this.x}, ${this.y}, ${this.x0}, ${this.y0}, ${this.x1}, ${this.y1}, ${this.image.key})`;
    }


    get_type(): string {
        return `Translation<${this.image.get_type()}>`;
    }

    clone(): this {
        return new Translation(this.x, this.y, this.image.clone()) as this;
    }

    translate(dx: number, dy: number): ConcreteImage {
        return new Translation(this.x + dx, this.y + dy, this.image.clone());        
    }

    compile(): ImageCompilation {
        const child = this.image.compile();
        
        return new ImageCompilation(child.x0 + this.x, child.y0 + this.y, child.x1 + this.x, child.y1 + this.y, 
            (x, y) => child.at(x - this.x, y - this.y)
        );
    }

    get cx() { return 0.5 * (this.x0 + this.x1); }
    get cy() { return 0.5 * (this.y0 + this.y1); } 

    number_functions() {
        return [...['x', 'y', 'x0', 'y0', 'x1', 'y1', 'cx', 'cy'].map(number_function),
            ...this.image.number_functions().map(prefix('image'))
        ];
    }

    color_functions() {
        return this.image.color_functions().map(prefix('image'));
    }

    grid_functions() {
        return this.image.grid_functions().map(prefix('image'));
    }

    sub_images_functions() {
        return this.image.sub_images_functions().map(prefix('image'));
    }
    
    async build_solver_function(solver: Solver, path: PathFunction): Promise<ImageFunction<SymbolicImage, ConcreteImage>> {
        log('Translation.build_solver_internal');
        let anchor_x: AnchorType = 'zero';
        let x_function = await solver.select_number_function(number_function('x').prefix(path));
        if (!x_function) {
            anchor_x = 0;
            x_function = await solver.select_number_function(number_function('x0').prefix(path));
        }
        if (!x_function) {
            anchor_x = 1;
            x_function = await solver.select_number_function(number_function('x1').prefix(path));
        }
        if (!x_function) {
            anchor_x = 'center';
            x_function = await solver.build_number_function(number_function('cx').prefix(path));
        }
        let anchor_y: AnchorType = 'zero';
        let y_function = await solver.select_number_function(number_function('y').prefix(path));
        if (!y_function) {
            anchor_y = 0;
            y_function = await solver.select_number_function(number_function('y0').prefix(path));
        }
        if (!y_function) {
            anchor_y = 1;
            y_function = await solver.select_number_function(number_function('y1').prefix(path));
        }
        if (!y_function) {
            anchor_y = 'center';
            y_function = await solver.build_number_function(number_function('cy').prefix(path));
        }

        const the_image_function = await this.image.build_solver_function(solver, image_function('image').prefix(path));
    
        return (image: SymbolicImage, ...indices) => new Translation(
                x_function!.f(image, ...indices), 
                y_function!.f(image, ...indices), 
                the_image_function(image, ...indices), 
                anchor_x, anchor_y)
            .set_builders({ [anchor_x === 0? 'x0' : anchor_x === 1? 'x1' : anchor_x === 'center'? 'cx' : 'x']: x_function!.path, 
                [anchor_y === 0? 'y0' : anchor_y === 1? 'y1' : anchor_y === 'center'? 'cy' : 'y']: y_function!.path});
    }

    *grids() {
        for (const grid of this.image.grids()) {
            yield grid;
        }
    }

    *images() {
        yield this.image;
    }
}

export class ImageTransformation<I extends ConcreteImage> extends ConcreteImage {
    constructor(public transformation: Transform, public image: I) {
        super();
    }

    get key(): string {
        return `ImageTransformation(${this.transformation}, ${this.image.key})`;
    }

    get_type(): string {
        return `ImageTransformation<${this.image.get_type()}>`;
    }

    clone(): this {
        return new ImageTransformation(this.transformation, this.image.clone()) as this;
    }

    translate(dx: number, dy: number): ConcreteImage {
        return new Translation(dx, dy, this.clone());
    }

    compile(): ImageCompilation {
        
        const child = this.image.compile();
        const dx = child.x1 - child.x0;
        const dy = child.y1 - child.y0;

        switch (this.transformation) {
            case Transform.identity: 
                return new ImageCompilation(child.x0, child.y0, child.x1, child.y1, child.at);
            case Transform.flip_x:
                return new ImageCompilation(-child.x1, child.y0, -child.x0, child.y1, (x, y) => child.at(-x, y));
            case Transform.flip_y: 
                return new ImageCompilation(child.x0, -child.y1, child.x1, -child.y0, (x, y) => child.at(x, -y));
            case Transform.rotate_180: 
                return new ImageCompilation(-child.x1, -child.y1, -child.x0, -child.y0, (x, y) => child.at(-x, -y));
            case Transform.transpose: 
                return new ImageCompilation(child.y0, child.x0, child.y1, child.x1, (x, y) => child.at(y, x))
            case Transform.opposite_transpose:
                return new ImageCompilation(-child.y1, -child.x1, -child.y0, -child.x0, (x, y) => child.at(-y, -x));
            case Transform.rotate_90:
                return new ImageCompilation(-child.y1, child.x0, -child.y0, child.x1, (x, y) => child.at(y, -x));
            case Transform.rotate_270:
                return new ImageCompilation(child.y0, -child.x1, child.y1, -child.x0, (x, y) => child.at(-y, x));
            case Transform.tile:
                return new ImageCompilation(-Infinity, -Infinity, Infinity, Infinity, (x, y) => {
                    const rx = (x - child.x0) / dx;
                    const ry = (y - child.y0) / dy;
                    const fx = Math.floor(rx);
                    const fy = Math.floor(ry);
                    return child.at(child.x0 + dx * (rx - fx), child.y0 + dy * (ry - fy));
                });
            case Transform.tile_x:
                return new ImageCompilation(-Infinity, child.y0, Infinity, child.y1, (x, y) => {
                    const rx = (x - child.x0) / dx;
                    const fx = Math.floor(rx);
                    return child.at(child.x0 + dx * (rx - fx), y);
                });
            case Transform.tile_y:
                return new ImageCompilation(child.x0, -Infinity, child.x1, Infinity, (x, y) => {
                    const ry = (y - child.y0) / dy;
                    const fy = Math.floor(ry);
                    return child.at(x, child.y0 + dy * (ry - fy));
                });
            case Transform.ping_pong:
                return new ImageCompilation(-Infinity, -Infinity, Infinity, Infinity, (x, y) => {
                    const rx = (x - child.x0) / dx;
                    const ry = (y - child.y0) / dy;
                    const fx = Math.floor(rx);
                    const fy = Math.floor(ry);
                    return child.at(child.x0 + dx * ((fx & 1) == 0 ? (rx - fx) : (1 - rx + fx)), child.y0 + dy * ((fy & 1) == 0 ? (ry - fy) : (1 - ry + fy)));
                });
            case Transform.ping_pong_x:
                return new ImageCompilation(-Infinity, -Infinity, Infinity, Infinity, (x, y) => {
                    const rx = (x - child.x0) / dx;
                    const ry = (y - child.y0) / dy;
                    const fx = Math.floor(rx);
                    const fy = Math.floor(ry);
                    return child.at(child.x0 + dx * ((fx & 1) == 0 ? (rx - fx) : (1 - rx + fx)), child.y0 + dy * (ry - fy));
                });
            case Transform.ping_pong_y:
                return new ImageCompilation(-Infinity, -Infinity, Infinity, Infinity, (x, y) => {
                    const rx = (x - child.x0) / dx;
                    const ry = (y - child.y0) / dy;
                    const fx = Math.floor(rx);
                    const fy = Math.floor(ry);
                    return child.at(child.x0 + dx * (rx - fx), child.y0 + dy * ((fy & 1) == 0 ? (ry - fy) : (1 - ry + fy)));
                });
            case Transform.rotation: {
                const radius = Math.max(Math.abs(child.x0), Math.abs(child.x1), Math.abs(child.y0), Math.abs(child.y1));
                const at1 = child.at;
                const at2 = new ImageTransformation(Transform.rotate_90, this.image).compile().at;
                const at3 = new ImageTransformation(Transform.rotate_180, this.image).compile().at;
                const at4 = new ImageTransformation(Transform.rotate_270, this.image).compile().at;

                return new ImageCompilation(-radius, -radius, radius, radius, (x, y) => {
                    const c1 = at1(x, y);
                    const c2 = at2(x, y);
                    const c3 = at3(x, y);
                    const c4 = at4(x, y);
                    return c1 !== Color.black? c1 : c2 !== Color.black? c2 : c3 !== Color.black? c3 : c4;
                })
            }

        }
    }

    number_functions() {
        return this.image.number_functions().map(prefix('image'));
    }

    color_functions() {
        return this.image.color_functions().map(prefix('image'));
    }

    grid_functions() {
        return this.image.grid_functions().map(prefix('image'));
    }

    sub_images_functions() {
        return this.image.sub_images_functions().map(prefix('image'));
    }

    async build_solver_function(solver: Solver, path: PathFunction): Promise<ImageFunction<SymbolicImage, ConcreteImage>> {
        log('ImageTransformation.build_solver_internal');
        const solver_function = await this.image.build_solver_function(solver, image_function('image').prefix(path));
        return (image, ...indices) => new ImageTransformation(this.transformation, solver_function(image, ...indices));
    }

    *grids() {
        for (const grid of this.image.grids()) {
            yield grid;
        }
    }

    *images() {
        yield this.image;
    }
}


export class BackgroundPixel extends ConcreteImage {

    get key(): string {
        return `BackgroundPixel()`;
    }


    get_type(): string {
        return `BackgroundPixel`;
    }

    clone(): this {
        return new BackgroundPixel as this;    
    }

    translate(dx: number, dy: number): ConcreteImage {
        return new Translation(dx, dy, this.clone());       
    }

    compile(): ImageCompilation {
        return new ImageCompilation(-0.5, -0.5, 0.5, 0.5, (_x, _y) => Color.black); 
    }
}

export class Pixel extends ConcreteImage {
    constructor(public color?: Color) {
        super();
    }

    get key(): string {
        return `Pixel(${this.color})`;
    }

    get_type(): string {
        return 'Pixel';
    }

    clone(): this {
        return new Pixel(this.color) as this;
    }

    translate(dx: number, dy: number): ConcreteImage {
        return new Translation(dx, dy, this.clone());       
    }

    compile(): ImageCompilation {
        return new ImageCompilation(-0.5, -0.5, 0.5, 0.5, this.color !== undefined? (_x, _y) => this.color!: (_x, _y) => Color.true); 
    }

    color_functions() {
        return [color_function('color')];
    }

    async build_solver_function(solver: Solver, path: PathFunction): Promise<ImageFunction<SymbolicImage, ConcreteImage>> {
        log('Pixel.build_solver_internal');
        const the_color_function = await solver.build_color_function(color_function('color').prefix(path))
        return (image: SymbolicImage, ...indices) => new Pixel(the_color_function.f(image, ...indices)!).set_builders({ color: the_color_function.path });
    }
}

export class SolidColor extends ConcreteImage {
    constructor(public color?: Color) {
        super();
    }

    get key(): string {
        return `SolidColor(${this.color})`;
    }

    get_type(): string {
        return 'SolidColor';
    }

    clone(): this {
        return new SolidColor(this.color) as this;
    }

    translate(_dx: number, _dy: number): ConcreteImage {
        return this.clone();
    }

    compile(): ImageCompilation {
        return new ImageCompilation(-Infinity, -Infinity, Infinity, Infinity, this.color !== undefined? (_x, _y) => this.color!: (_x, _y) => Color.true); 
    }

    color_functions() {
        return [color_function('color')];
    }

    async build_solver_function(solver: Solver, path: PathFunction): Promise<ImageFunction<SymbolicImage, ConcreteImage>> {
        log('SolidColor.build_solver_internal');
        const the_color_function = await solver.build_color_function(color_function('color').prefix(path));
        return (image: SymbolicImage, ...indices) => new SolidColor(the_color_function.f(image, ...indices)!).set_builders({ color: the_color_function.path });
    }
}

export class Procedural extends ConcreteImage {
    constructor(public at: (x: number, y: number) => Color) {
        super();
    }

    get key(): string {
        return `Procedural()`;
    }

    get_type(): string {
        return 'Procedural';
    }

    clone(): this {
        return new Procedural(this.at) as this;
    }

    translate(dx: number, dy: number): ConcreteImage {
        return new Translation(dx, dy, this.clone());       
    }

    compile(): ImageCompilation {
        return new ImageCompilation(-Infinity, -Infinity, Infinity, Infinity, this.at); 
    }
}

export class Concentric<I extends ConcreteImage> extends ConcreteImage {
    constructor(public image: I) {
        super();
    }

    get key(): string {
        return `Concentric()`;
    }

    get_type(): string {
        return `Concentric<${this.image.get_type()}>`;
    }

    clone(): this {
        return new Concentric(this.image.clone()) as this;
    }

    translate(dx: number, dy: number): ConcreteImage {
        return new Concentric(this.image.translate(dx, dy));        
    }

    compile(): ImageCompilation {
        const child = this.image.compile();
        return new ImageCompilation(-child.x1, -child.x1, child.x1, child.x1, (x, y) => child.at(Math.max(Math.abs(x), Math.abs(y)), 0));
    }

    *grids() {
        for (const grid of this.image.grids()) {
            yield grid;
        }
    }
    *images() {
        yield this.image;
    }
}

export class Info<I1 extends ConcreteImage, I2 extends ConcreteImage> extends ConcreteImage {
    constructor(public image: I1, public info: I2) {
        super();
    }

    get key(): string {
        return `Info(${this.image.key}, ${this.info.key})`;
    }

    get_type(): string {
        return `Info<${this.image.get_type()},${this.info.get_type()}>`;
    }

    clone(): this {
        return new Info(this.image.clone(), this.info.clone()) as this;
    }

    translate(dx: number, dy: number): ConcreteImage {
        return new Info(this.image.translate(dx, dy), this.info.translate(dx, dy)) as this;
    }

    compile(): ImageCompilation {
        const c1 = this.image.compile();
        const c2 = this.info.compile();

        return new ImageCompilation(Math.min(c1.x0, c2.x0), Math.min(c1.y0, c2.y0), Math.max(c1.x1, c2.x1), Math.max(c1.y1, c2.y1), c1.at); 
    }

    *grids() {
        for (const grid of this.image.grids()) {
            yield grid;
        }
        for (const grid of this.info.grids()) {
            yield grid;
        }
    }
    *images() {
        yield this.image;
        yield this.info;
    }
}

export function translate<I extends ConcreteImage>(x: number, y: number, image: I): Translation<I> {
    return new Translation(x, y, image);
}

export function set_background<I extends ConcreteImage>(color: Color, image: I): BackgroundColor<I> {
    return new BackgroundColor(color, image);
}

export function make_object_list<I extends ConcreteImage>(list: I[]): SubImages<I> {
    return new SubImages(list, 'free');
}

export function make_rotation<I extends ConcreteImage>(image: I): SubImages<ImageTransformation<I>> {
    return new SubImages([
        new ImageTransformation(Transform.identity, image),
        new ImageTransformation(Transform.rotate_90, image),
        new ImageTransformation(Transform.rotate_180, image),
        new ImageTransformation(Transform.rotate_270, image),
    ], 'free');
}

export function make_image_window<I extends ConcreteImage>(image: I): ImageWindow<I> {
    const compilation = image.compile();
    return new ImageWindow(compilation.x0, compilation.y0, compilation.x1, compilation.y1, image);
}

