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
import { Grid } from "./Grid";
import { all } from "./Misc";
import { Solver,ImageFunction, CantBuildNumberFunction, CantBuildColorFunction, CantBuildGridFunction, BooleanFunction, NumberFunction, ColorFunction, GridFunction, F, PathFunction, prefix_generation, SolverOptions } from "./Solver";
import { SymbolicImage } from "./SymbolicImage";
import { ConcreteImage, ImageCompilation, Translation } from "./ConcreteImage";
import { log } from "./Logger";

export class Abstraction extends ConcreteImage {

    black_box = false;

    number_arguments: number[] = [];
    color_arguments: Color[] = [];
    grid_arguments: Grid[] = [];
    build_parts?: (abstraction: Abstraction) => void;

    get_number_arguments: NumberFunction[] = [];
    get_color_argumennts: ColorFunction[] = [];
    get_grid_arguments: GridFunction[] = [];

    parts: ConcreteImage[] = [];

    parts_selector: BooleanFunction[] = [];

    sub_images_to_classify: ConcreteImage[] = [];

    solver_options: SolverOptions = {
        no_mapping: true,
        no_decision_tree: true
    }

    constructor(public name: string, public sub_images: ConcreteImage[]) {
        super();
    }

    get_type(): string {
        return `Abstraction<${this.name}>`;
    }

    clone(): this {
        const flesh_abstraction = this.make_flesh_abstraction();
        const clone = new Abstraction(this.name, this.sub_images.map(sub_image => sub_image.clone())) as this;
        flesh_abstraction(clone);
        return clone;
    }

    translate(dx: number, dy: number): ConcreteImage {
        if (this.build_parts) {
            return new Translation(dx, dy, this.clone());
        } else {
            return new Abstraction(this.name, this.sub_images.map(sub_image => sub_image.translate(dx, dy)));
        }
    }

    compile(): ImageCompilation {
        const children = this.sub_images.map(child_image => child_image.compile());
        const x0 = Math.min(...children.map(child => child.x0));
        const x1 = Math.max(...children.map(child => child.x1));
        const y0 = Math.min(...children.map(child => child.y0));
        const y1 = Math.max(...children.map(child => child.y1));
        const at = 
            (x: number, y: number) => {
                for (const child of children) {
                    if (x >= child.x0 && x < child.x1 && y >= child.y0 && y < child.y1) {
                        const color = child.at(x, y);
                        if (color !== Color.black) {
                            return color;
                        }
                    }
                }
                return Color.black;
            };

        return new ImageCompilation(x0, y0, x1, y1, at);
    }

    get_number_argument(index: number) {
        return F.make(`number_arguments[${index}]`, (image: Abstraction) => image.number_arguments[index]);
    }

    number_functions() {
        const number_functions: NumberFunction[] = this.number_arguments.map((_value, i) => this.get_number_argument(i));

        if (!this.black_box) {
            for (let i = 0; i < this.parts.length; i++) {
                const part = this.parts[i];
                for (const f of part.number_functions()) {
                    number_functions.push(f.prefix_list('parts', i));
                }
            }
        }

        return number_functions;
    }

    get_color_argument(index: number) {
        return F.make(`color_arguments[${index}]`, (image: Abstraction) => image.color_arguments[index]);
    }

    color_functions() {
        const color_functions: ColorFunction[] = this.color_arguments.map((_value, i) => this.get_color_argument(i));

        if (!this.black_box) {
            for (let i = 0; i < this.parts.length; i++) {
                const part = this.parts[i];
                for (const f of part.color_functions()) {
                    color_functions.push(f.prefix_list('parts', i));
                }
            }
        }

        return color_functions;
    }

    get_grid_argument(index: number) {
        return F.make(`grid_arguments[${index}]`, (image: Abstraction) => image.grid_arguments[index]);
    }

    grid_functions() {
        const grid_functions: GridFunction[] = this.grid_arguments.map((_value, i) => this.get_grid_argument(i));

        if (!this.black_box) {
            for (let i = 0; i < this.parts.length; i++) {
                const part = this.parts[i];
                for (const f of part.grid_functions()) {
                    grid_functions.push(f.prefix_list('parts', i));
                }
            }
        }

        return grid_functions;
    }

    *grids() {
        for (const elem of this.sub_images) {
            for (const grid of elem.grids()) {
                yield grid;
            }    
        }
    }

    make_flesh_abstraction(select_parts = true) {
        const build_parts = this.build_parts;
        const get_number_arguments = [...this.get_number_arguments];
        const get_color_argumennts = [...this.get_color_argumennts];
        const get_grid_arguments = [...this.get_grid_arguments];
        const parts_selector = [...this.parts_selector];
        const black_box = this.black_box;

        return (abstraction: Abstraction) => {
            abstraction.black_box = black_box;
            abstraction.build_parts = build_parts;
            abstraction.get_number_arguments = [...get_number_arguments];
            abstraction.get_color_argumennts = [...get_color_argumennts];
            abstraction.get_grid_arguments = [...get_grid_arguments];
            abstraction.parts_selector = [...parts_selector];

            return !select_parts || abstraction.select_parts();
        }
    }

    get_arguments() {
        this.number_arguments = this.get_number_arguments.map(f => {
            try {
                return f.f(this)!;
            } catch (_e) {
                return undefined!;
            }
        });
        this.color_arguments = this.get_color_argumennts.map(f => {
            try {
                return f.f(this)!;
            } catch (_e) {
                return undefined!;
            }
        });
        this.grid_arguments = this.get_grid_arguments.map(f => {
            try {
                return f.f(this)!;
            } catch (_e) {
                return undefined!;
            }
        });
    }

    select_parts() {
        this.parts = [];
        this.sub_images_to_classify = this.sub_images;

        for (const part_selector of this.parts_selector) {

            const selected_sub_images = this.sub_images_to_classify.filter((_, index) => part_selector.f(this, index));
            if (selected_sub_images.length !== 1) {
                log(`select_parts failed count = ${selected_sub_images.length}`);
                log({ image: this, selector: part_selector.path, images: [...this.sub_images_to_classify], parts: [...this.parts] })
                return false;
            }
            const part = selected_sub_images[0];
            this.parts.push(part);
            this.get_arguments();
            this.sub_images_to_classify = this.sub_images_to_classify.filter(sub_image => sub_image !== part);
        }

        /*log('select_parts succeeded!');
        log(this);*/
        
        return true;
    }

    build() {
        this.build_parts!(this);
    }

    async build_solver_function(solver: Solver, path: PathFunction): Promise<ImageFunction<SymbolicImage, ConcreteImage>> {
        log('Abstraction.build_solver_internal');

        const number_arguments_finders = await Promise.all(this.number_arguments.map((_, i) => solver.build_number_function(this.get_number_argument(i).prefix(path))));
        const color_arguments_finders = await Promise.all(this.color_arguments.map((_, i) => solver.build_color_function(this.get_color_argument(i).prefix(path))));
        const grid_arguments_finders = await Promise.all(this.grid_arguments.map((_, i) => solver.build_grid_function(this.get_grid_argument(i).prefix(path))));
        const flesh_abstraction = this.make_flesh_abstraction(false);

        return (image, ...indices) => {
            const abstraction = new Abstraction(this.name, []).set_builders({
                number_arguments: number_arguments_finders.map(finder => finder.path),
                color_arguments: color_arguments_finders.map(finder => finder.path),
                grid_arguments: grid_arguments_finders.map(finder => finder.path)
            });

            flesh_abstraction(abstraction);

            abstraction.number_arguments = number_arguments_finders.map(f => f.f(image, ...indices)!);
            abstraction.color_arguments = color_arguments_finders.map(f => f.f(image, ...indices)!);
            abstraction.grid_arguments = grid_arguments_finders.map(f => f.f(image, ...indices)!);

            abstraction.build();

            abstraction.sub_images = [...abstraction.parts];

            log('abstraction constructed!');
            log(abstraction);

            return abstraction;
        };
    }

    async add_part(part_selector: BooleanFunction, input_abstractions: Abstraction[], output_abstractions: Abstraction[]): Promise<boolean> {

        const generic_input_abstraction = this.clone();
        generic_input_abstraction.black_box = false;
        this.black_box = false;

        const part_index = this.parts_selector.length;
        this.parts_selector.push(part_selector);

        let max_count = 100;
        while (max_count--) {
            const input_flesh_abstraction = generic_input_abstraction.make_flesh_abstraction();
            const output_flesh_abstraction = this.make_flesh_abstraction();

            if (!output_flesh_abstraction(this)) {
                log(this);
                log('add_part flesh_abstraction failed');
                return false;
            }
    
            for (const input of input_abstractions) {
                if (!input_flesh_abstraction(input)) {
                    log(input);
                    log('add_part input flesh_abstraction failed');
                    return false;
                }
            }
    
            for (const output of output_abstractions) {
                if (!output_flesh_abstraction(output)) {
                    log(output);
                    log('addpart output flesh_abstraction failed');
                    return false;
                }
            }

            for (let i = 0; i < input_abstractions.length; i++) {
                const input = input_abstractions[i];
                const output = output_abstractions[i];

                input.number_arguments = [...output.number_arguments];
                input.color_arguments = [...output.color_arguments];
                input.grid_arguments = [...output.grid_arguments];
            }

            log('add_part trying to solve');
            log(input_abstractions.map(obj => { 
                const clone = obj.clone(); 
                clone.number_arguments = [...obj.number_arguments];
                clone.color_arguments = [...obj.color_arguments];
                clone.grid_arguments = [...obj.grid_arguments];
                return clone; 
            } ));
            log(output_abstractions.map(obj => obj.clone()));
    
            const solver = await Solver.make(input_abstractions, output_abstractions, this.solver_options);
    
            try {
                const part_solver = await this.parts[part_index].build_solver_function(solver, F.make<ConcreteImage, SymbolicImage>('parts', undefined, part_index));
    
                const previous_build_parts = this.build_parts;
                this.build_parts = (abstraction: Abstraction) => {
                    if (previous_build_parts) {
                        previous_build_parts(abstraction);
                    }
                    abstraction.parts.push(part_solver(abstraction));
                };
    
                return true;
    
            } catch (e) {
                if (e instanceof CantBuildNumberFunction) {
                    log('CantBuildNumberFunction');
                    this.get_number_arguments.push(e.number_function);
                } else if (e instanceof CantBuildColorFunction) {
                    log('CantBuildColorFunction');
                    this.get_color_argumennts.push(e.color_function);
                } else if (e instanceof CantBuildGridFunction) {
                    log('CantBuildGridFunction');
                    this.get_grid_arguments.push(e.grid_function);
                } else {
                    log(e);
                    return false;
                }
            }
    
        }

        return false;
    }

    async abstract_new_part(input_abstractions: Abstraction[], output_abstractions: Abstraction[]) {

        this.black_box = false;
        const flesh_abstraction = this.make_flesh_abstraction();

        if (!flesh_abstraction(this)) {
            return false;
        }

        for (const input of input_abstractions) {
            if (!flesh_abstraction(input)) {
                return false;
            }
        }

        for (const output of output_abstractions) {
            if (!flesh_abstraction(output)) {
                return false;
            }
        }

        if (this.sub_images_to_classify.length === 0) {
            return false;
        }

        const subimages_per_type: Map<string, ConcreteImage[]> = new Map();

        for (const sub_image of this.sub_images_to_classify) {
            const type = sub_image.get_type();
            if (subimages_per_type.has(type)) {
                subimages_per_type.get(type)?.push(sub_image);
            } else {
                subimages_per_type.set(type, [sub_image]);
            }
        }

        const make_type_descriminator = (type: string) => {
            const result = new F(`sub_images_to_classify[i0].get_type() === '${type}'}`, (image, ...indices) => (image as Abstraction).sub_images_to_classify[indices[0]].get_type() === type);

            return result;
        }

        for (const [type, list] of subimages_per_type) {
            if (list.length === 1) {
                return await this.add_part(make_type_descriminator(type), input_abstractions, output_abstractions);
            }
        }

        for (const [type, list] of subimages_per_type) {
            const solver = await Solver.make(input_abstractions, output_abstractions, this.solver_options);

            const is_right_type: BooleanFunction = make_type_descriminator(type);

            const sub_solver = await solver.make_sub_solver({
                length_function: F.make('sub_images_to_classify.length', (image, ..._indices) => (image as Abstraction).sub_images_to_classify.length),
                index_function: F.make('i0', (_image, ...indices) => indices[0]),
                sub_images_functions: [],
                number_functions: list[0].number_functions().map(prefix_generation('sub_images_to_classify', 0)),
                color_functions: list[0].color_functions().map(prefix_generation('sub_images_to_classify', 0)),
                grid_number_functions: list[0].grid_functions().map(prefix_generation('sub_images_to_classify', 0)).map(solver.raise_grid_number_function)
            }, is_right_type);

            if (sub_solver) {
                for await (const part_selector of sub_solver.sub_solver.enum_boolean_selectors()) {
                    log("part_selector found!")
                    log(part_selector.path);
                    return await this.add_part(F.and(is_right_type, part_selector), input_abstractions, output_abstractions);
                }
            }

            return false;
        }
    }

    check_potential_abstraction(abstractions: Abstraction[]) {
        const subimages_per_type: Map<string, ConcreteImage[]> = new Map();

        for (const sub_image of this.sub_images) {
            const type = sub_image.get_type();
            if (subimages_per_type.has(type)) {
                subimages_per_type.get(type)?.push(sub_image);
            } else {
                subimages_per_type.set(type, [sub_image]);
            }
        }

        return all(abstractions, abstraction => {
            for (const [type, list] of subimages_per_type) {
                if (abstraction.sub_images.filter(sub_image => sub_image.get_type() === type).length !== list.length) {
                    return false;
                }
            }
            return true;
        });
    }

    async abstract_all_parts(abstractions: Abstraction[]) {
        if (!this.check_potential_abstraction(abstractions)) {
            log('failed check potentioal abstraction');
            return false;
        }    

        const input_abstractions = abstractions;
        const output_abstractions = abstractions.map(abstraction => abstraction.clone());

        while (await this.abstract_new_part(input_abstractions, output_abstractions)) {
            log('abstracted a new part');
            //log(this);
        }

        log(this);

        this.black_box = false;
        const flesh_abstraction = this.make_flesh_abstraction();

        if (!flesh_abstraction(this)) {
            log('flesh_abstraction failed');
            return false;
        }

        for (const input of input_abstractions) {
            if (!flesh_abstraction(input)) {
                log('flesh_abstraction failed on input_abstractions');
                return false;
            }
        }

        for (const output of output_abstractions) {
            if (!flesh_abstraction(output)) {
                log('flesh_abstraction failed on output_abstractions');
                return false;
            }
        }

        const everything_classified = all(input_abstractions, input => input.sub_images_to_classify.length === 0);

        if (!everything_classified) {
            log('not everything classified!');
        }

        return everything_classified;
    }

    *images() {
        for (const sub_image of this.sub_images) {
            yield sub_image;
        }
    }


    static async discover_abstractions(images: ConcreteImage[]) {
        const abstractions: Map<string, Abstraction[]> = new Map();
        const flesh_abstractions_on_image: ((image: ConcreteImage) => void)[] = [];

        for (const image of images) {
            for (const abstraction of image.recur_images()) {
                if (abstraction instanceof Abstraction) {
                    if (abstractions.has(abstraction.name)) {
                        abstractions.get(abstraction.name)?.push(abstraction.clone());
                    } else {
                        abstractions.set(abstraction.name, [abstraction.clone()]);
                    }
                }
            }
        }

        for (const [name, abstraction_list] of abstractions) {
            const model = abstraction_list[0].clone();

            if (await model.abstract_all_parts(abstraction_list)) {
                log(`abstraction ${name} discovered!`);
                const flesh_abstraction = model.make_flesh_abstraction();
                const flesh_abstraction_on_image = (image: ConcreteImage) => {
                    for (const abstraction of image.recur_images()) {
                        if (abstraction instanceof Abstraction && abstraction.name === name) {
                            flesh_abstraction(abstraction);
                        }
                    }
                }
                
                for (const image of images) {
                    flesh_abstraction_on_image(image);
                }

                flesh_abstractions_on_image.push(flesh_abstraction_on_image);
            } else {
                log(`abstraction ${name} failed!`)
            }
        }

        return (image: ConcreteImage) => {
            for (const func of flesh_abstractions_on_image) {
                func(image);
            }
        }
    }
}

