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

import { ArcPuzzle,is_solution } from "./ArcPuzzle";
import { ConcreteImage } from "./ConcreteImage";
import { decomposer_to_list,build_decomposer } from "./Decomposers";
import { alternatives, background, basic_grid, block_list, centered, color_decomposition, Decomposer, decomposer_clone, decomposer_remove_failed_alternatives, decomposer_to_key, find_master_grid, horizontal_decomposition, image_window, master_grid, master_grid2, monochrome, monochrome_decomposition_abstraction, monochrome_object_list, monochrome_object_list2, object_list, object_list2, pixel_grid, scaled, semantic_box, solid_color, tile, tile_x, transform, trim_object, trim_object_center } from "./DecomposersData.ts";
import { Grid } from "./Grid";
import { log } from "./Logger";
import { append_vectors } from "./Misc";
import { Solver,F } from "./Solver";
import { SymbolicImage } from "./SymbolicImage";
import { evaluate_solver } from "./Solution";
import { Rasterizer } from "./Rasterizer.ts";
import { Abstraction } from "./Abstraction.ts";
import { access } from "fs";


function add_root(decomposer: Decomposer): Decomposer[] {
  return [horizontal_decomposition(decomposer),
    find_master_grid(decomposer),
    monochrome_object_list(decomposer),
    find_master_grid(decomposer, 5),
    color_decomposition(decomposer),
    object_list(decomposer),
    monochrome_object_list2(decomposer),
    object_list2(decomposer),
    find_master_grid(decomposer, 5, true),
    master_grid2(2,2, decomposer),
    master_grid2(3,3, decomposer),
    master_grid2(4,4, decomposer),
    find_master_grid(decomposer, undefined, true),
    block_list(decomposer)];  
} 

function add_prefix(decomposer: Decomposer): Decomposer[] {
  return [
    decomposer,
    background(10, decomposer),
    image_window(trim_object_center(decomposer)),
    trim_object(decomposer),
    background(undefined, decomposer),
    image_window(decomposer),
    transform(4, image_window(decomposer)),
    background(10, image_window(decomposer)),
  ];
}

const alternatives_suffix: Decomposer = alternatives([
  trim_object(basic_grid),
  monochrome(image_window(basic_grid)),
  basic_grid,
  monochrome(basic_grid),
  trim_object_center(basic_grid),
  trim_object(image_window(solid_color)),
  image_window(solid_color),
  image_window(basic_grid),
  trim_object(monochrome(scaled(basic_grid))),
  monochrome(trim_object(basic_grid)),
  image_window(solid_color),
  trim_object(monochrome(basic_grid)),
  image_window(monochrome(basic_grid)),
  trim_object(image_window(monochrome(basic_grid))),
  trim_object(image_window(background(7, monochrome(basic_grid)))),
  centered(basic_grid),
  trim_object(semantic_box),
  trim_object(image_window(solid_color)),
  trim_object(image_window(basic_grid)),
  monochrome(trim_object(semantic_box))
]);

function add_mastergrids(decomposer: Decomposer) {
  return [
    master_grid(2,2, decomposer),
    master_grid(2,1, decomposer),
    master_grid(1,2, decomposer),
    master_grid(3,3, decomposer),
    master_grid(3,1, decomposer),  
    master_grid(1,3, decomposer),
  ]
}

const alternatives_standalone = alternatives([
  image_window(tile(basic_grid)),
  image_window(monochrome(basic_grid)),
  image_window(trim_object(image_window(monochrome(basic_grid)))),
  image_window(trim_object(image_window(background(2, monochrome(basic_grid))))),
  image_window(trim_object(monochrome(basic_grid))),
  image_window(pixel_grid),
  image_window(solid_color),
  image_window(basic_grid),
  image_window(trim_object(image_window(solid_color))),
  basic_grid,
  monochrome(basic_grid),
  scaled(basic_grid),
  background(5, monochrome(basic_grid)),
  semantic_box,
  trim_object(basic_grid),
  image_window(trim_object(tile_x(basic_grid))),
  trim_object(image_window(monochrome(basic_grid))),
  image_window(monochrome(trim_object(basic_grid))),
  pixel_grid,
  background(undefined, trim_object(basic_grid)),
  tile(basic_grid),
  ...add_mastergrids(alternatives_suffix)
]);

const main_decomposers = append_vectors(...add_root(alternatives_suffix).map(decomposer => add_prefix(decomposer)));
//const main_decomposers = add_root(alternatives_suffix);

export const default_decomposers_to_try: { decomposer_input: Decomposer, decomposer_output: Decomposer}[] = [
  { decomposer_input: alternatives_standalone, decomposer_output: alternatives_standalone },
  ...main_decomposers.map(decomposer => { return { decomposer_input: decomposer, decomposer_output: decomposer }}),
  ...main_decomposers.map(decomposer => { return { decomposer_input: decomposer, decomposer_output: alternatives_standalone }}),
]

export async function solve_puzzle_trying_default_decomposers(puzzle: ArcPuzzle) {
  return await solve_puzzle_trying_all_decomposers(puzzle, default_decomposers_to_try);
}

export async function solve_puzzle_trying_all_decomposers(puzzle: ArcPuzzle, decomposers: { decomposer_input: Decomposer, decomposer_output: Decomposer}[]) {

  const seen_configuration = new Set<string>();

  for (const { decomposer_input, decomposer_output } of decomposers) {
    log(`Doing ${decomposer_to_key(decomposer_input)} -> ${decomposer_to_key(decomposer_output)}`);
    if (await solve_puzzle_using_decomposers(puzzle, decomposer_input, decomposer_output, seen_configuration)) {
      return true;
    }
  }

  return false;
}



export async function solve_puzzle_using_decomposers(puzzle: ArcPuzzle, decomposer_input_data: Decomposer, decomposer_output_data: Decomposer, seen_configuration: Set<string>) {

    decomposer_input_data = decomposer_clone(decomposer_input_data);
    decomposer_output_data = decomposer_clone(decomposer_output_data);

    try {
        let bug = false;
        let success = true;

        log(`Trying ${decomposer_to_list(decomposer_input_data).join(',')} -> ${decomposer_to_list(decomposer_output_data).join(',') }`);

        await new Promise(resolve => setTimeout(resolve, 1));

        try {
            let decomposer_input = build_decomposer(decomposer_input_data);
            let decomposer_output = build_decomposer(decomposer_output_data);

            for (const sample of puzzle.train) {
                decomposer_input(Grid.from_grid(sample.input));
                decomposer_output(Grid.from_grid(sample.output));
            }

            for (const sample of puzzle.test) {
                decomposer_input(Grid.from_grid(sample.input));
            }

            decomposer_input_data = decomposer_remove_failed_alternatives(decomposer_input_data);
            decomposer_output_data = decomposer_remove_failed_alternatives(decomposer_output_data);

            decomposer_input = build_decomposer(decomposer_input_data);
            decomposer_output = build_decomposer(decomposer_output_data);

            const samples = [...puzzle.train];
            const input_images = samples.map(sample => decomposer_input(Grid.from_grid(sample.input)));
            const output_images = samples.map(sample => decomposer_output(Grid.from_grid(sample.output)));

            const key = `${input_images.map(image => image.key).join(',')}->${output_images.map(image => image.key).join(',')}`;

            if (seen_configuration.has(key)) {
              return false;
            } else {
              seen_configuration.add(key);
            }

            const solver_instance = await Solver.make(input_images, output_images, { no_decision_tree: true, no_mapping: false, no_sub_table_analysis: true });

            puzzle.decomposer_input = decomposer_input_data;
            puzzle.decomposer_output = decomposer_output_data;

            let fsolver: ((grid: Grid) => Grid) | undefined = undefined;

            try {
              const image_to_image = await output_images[0].build_solver_function(solver_instance, F.make<SymbolicImage, ConcreteImage>('input', image => image));
            
              fsolver = (grid: Grid) => {
                  const result = image_to_image(decomposer_input(grid)).to_grid();
                  return result;
              }
            } catch(_e) {
              bug = true;
              success = false;
            }
        
            if (typeof fsolver !== 'function') {
              bug = true;
            } else {
              for (const sample of puzzle.train) {
                sample.solution = fsolver(Grid.from_grid(sample.input)).to_grid();
                success = success && is_solution(sample);
              }
              for (const sample of puzzle.test) {
                sample.solution = fsolver(Grid.from_grid(sample.input)).to_grid();
                success = success && is_solution(sample);
              }  
            }
        } catch (_e) {
          bug = true;
          success = false;
        }
        puzzle.state = success? 'solved' : bug? 'bug' : 'failed';
        puzzle.type = 2;

        if (bug) {
          return false;
        } else {
          for (const sample of puzzle.train) {
            if (!is_solution(sample)) {
              return false;
            }
          }

          return true;
        }

    } catch (_e) {
      puzzle.state = 'invalid';

      return false;
    }
}

new Rasterizer(2, new Abstraction('test', []), new Grid(1, 1));

export async function solve_puzzle(puzzle: ArcPuzzle) {
  if (puzzle.program_transpiled) {
    try {
      const solver = evaluate_solver(puzzle.program_transpiled);
      if (typeof solver === 'function') {
        puzzle.state = 'old';
        let bug = false;
        let success = true;
        try {
          const fsolver: (g: Grid) => Grid = solver;

          if (typeof fsolver !== 'function') {
            bug = true;
          } else {
            for (const sample of puzzle.train) {
              sample.solution = fsolver(Grid.from_grid(sample.input)).to_grid();
              success = success && is_solution(sample);
            }
            for (const sample of puzzle.test) {
              sample.solution = fsolver(Grid.from_grid(sample.input)).to_grid();
              success = success && is_solution(sample);
            }  
  
          }
        } catch (e) {
          success = false;
          console.error(e);
        }
        
      } else if (solver.rasterizer) {
        let bug = false;
        let success = true;
        try {
          const fsolver = (await Rasterizer.learn_rasterization(
            puzzle.train.map(sample => Grid.from_grid(sample.input)), 
            puzzle.train.map(sample => Grid.from_grid(sample.output)), 
            solver.decomposer_input!
          ))!;
          
          for (const sample of puzzle.train) {
            sample.solution = fsolver(Grid.from_grid(sample.input)).to_grid();
            success = success && is_solution(sample);
          }
          for (const sample of puzzle.test) {
            sample.solution = fsolver(Grid.from_grid(sample.input)).to_grid();
            success = success && is_solution(sample);
          }  

        } catch (e) {
          bug = true;
          success = false;
          console.error(e);
        }
        puzzle.state = success? 'solved' : bug? 'bug' : 'failed';
        puzzle.type = 2;

      } else {
        let bug = false;
        let success = true;
        let success2 = true;
        let marked = false;

        const type2 = solver.decomposer_output !== undefined;
    
        try {

          let fsolver = solver.solver;

          if (type2) {
            const samples = [...puzzle.train];
            const input_images = samples.map(sample => solver.decomposer_input!(Grid.from_grid(sample.input)));
            const output_images = samples.map(sample => solver.decomposer_output!(Grid.from_grid(sample.output)));

            const solver_instance = await Solver.make(input_images, output_images, { no_mapping: true });

            puzzle.decomposer_input = solver.decomposer_input_data;
            puzzle.decomposer_output = solver.decomposer_output_data;

            try {
              const image_to_image = await output_images[0].build_solver_function(solver_instance, F.make<SymbolicImage, ConcreteImage>('input', image => image));
            
              fsolver = (grid: Grid) => {
                  const result = image_to_image(solver.decomposer_input!(grid)).to_grid();
                  return result;
              }
            } catch(_e) {
              bug = true;
              success2 = false;
            }
          }
        
          if (typeof fsolver !== 'function') {
            bug = true;
          } else {
            for (const sample of puzzle.train) {
              sample.solution = fsolver(Grid.from_grid(sample.input)).to_grid();
              success2 = success2 && is_solution(sample);
            }
            for (const sample of puzzle.test) {
              sample.solution = fsolver(Grid.from_grid(sample.input)).to_grid();
              success2 = success2 && is_solution(sample);
            }  
          }
        } catch (e) {
          success2 = false;
          console.error(e);
        }
        try {

          let fsolver: (grid: Grid) => Grid = solver.solver;

          if (type2) {
            const samples = puzzle.train;
            const input_images = samples.map(sample => solver.decomposer_input!(Grid.from_grid(sample.input)));
            const output_images = samples.map(sample => solver.decomposer_output!(Grid.from_grid(sample.output)));

            console.log('discovering abstractions input')
            const flesh_input_abstractions = await Abstraction.discover_abstractions(input_images);
            console.log('discovering abstractions output')
            await Abstraction.discover_abstractions(output_images);
            console.log('discovering abstractions done')

            console.log(input_images);
            console.log(output_images);

            const solver_instance = await Solver.make(input_images, output_images, { no_decision_tree: false });
            if (solver_instance.is_marked()) {
              marked = true;
            }

            try {
              const image_to_image = await output_images[0].build_solver_function(solver_instance, F.make<ConcreteImage, SymbolicImage>('input', image => image as ConcreteImage));
            
              fsolver = (grid: Grid) => {
                  const input_image = solver.decomposer_input!(grid);
                  flesh_input_abstractions(input_image)
                  const image = image_to_image(input_image);
                  console.log(image);
                  const result = image.to_grid();
                  console.log(result);
                  return result;
              }
  
            } catch (_e) {
              bug = true;
              success = false;
            }
          }
        

          if (typeof fsolver !== 'function') {
            bug = true;
          } else {
            for (const sample of puzzle.train) {
              sample.solution = fsolver(Grid.from_grid(sample.input)).to_grid();
              success = success && is_solution(sample);
            }
            for (const sample of puzzle.test) {
              sample.solution = fsolver(Grid.from_grid(sample.input)).to_grid();
              success = success && is_solution(sample);
            }  
          }
        } catch (e) {
          success = false;
          console.error(e);
        }
        
        puzzle.state = marked? 'marked' : success? 'solved' : success2? 'half-solved' : bug? 'bug' : 'failed';
        puzzle.type = type2? 2 : 1;

        /*if (success) {
          try {
            const program = ts.createProgram({ rootNames: [program_name], options: {} });

            const sourceFileRaw = ts.createSourceFile(
              program_name,
              program_string,
              ts.ScriptTarget.Latest,
              false,
              ts.ScriptKind.TS
            );
          } catch (e) {
            console.error(e.toString());
          }
        }*/
      }
    } catch (e) {
      console.error(e);
      puzzle.state = 'invalid';
    }
  }
}

