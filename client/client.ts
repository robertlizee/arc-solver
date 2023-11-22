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

/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import {body, Button, Canvas, Container, Div, Table } from "./Element"
import { ArcPuzzle } from "../lib/ArcPuzzle";
import { make_puzzle_canvas } from "./ArcPuzzleElement";

import { Decomposer, decomposer_prefix, decomposer_root, decomposer_suffix, decomposer_to_key, normalize_decomposer } from "../lib/DecomposersData";
import { random_permutation } from "../lib/Misc";
import { set_logging } from "../lib/Logger";
import { default_decomposers_to_try, solve_puzzle } from "../lib/UsingSolver";
import { WorkerManager } from "../worker/WorkerManager";
import "monaco-editor/monaco.d.ts";

set_logging(true);

let ts: { transpile: any };

let editor: monaco.editor.IStandaloneCodeEditor;

async function dir(path: string) {
  return (await (await fetch(`${path}?ls=true`)).text()).split('\n').filter(x => x)
}

async function load_json(path: string) {
  return await (await fetch(path)).json();
}

async function load_text(path: string) {
  return await (await fetch(path)).text();
}

async function save(path: string, body: string | Blob) {
  await fetch(`${path}?save=true`, { method: "POST", body });
}

async function init_editor() {
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2015,
    allowNonTsExtensions: true,
  });
  
  var libSource = await load_text("All.d.ts");
  console.log(libSource);
  // extra libraries
  var libUri = "ts:filename/facts.d.ts";
  monaco.languages.typescript.javascriptDefaults.addExtraLib(libSource, libUri);
  // When resolving definitions and references, the editor will try to use created models.
  // Creating a model for the library allows "peek definition/references" commands to work with the library.
  monaco.editor.createModel(libSource, "typescript", monaco.Uri.parse(libUri));
}

async function solve_training() {
  const decomposers: { decomposer_input: Decomposer, decomposer_output: Decomposer }[] = await load_json('client/decomposers.json');
  //await solve_with_decomposers("ARC/training", random_permutation(decomposers));
  //await solve_with_decomposers("ARC/training", default_decomposers_to_try);
  await solve_with_decomposers("ARC/training", [...random_permutation(decomposers), ...default_decomposers_to_try]);
}

async function solve_evaluation() {
  const decomposers: { decomposer_input: Decomposer, decomposer_output: Decomposer }[] = await load_json('client/decomposers.json');
  //await solve_with_decomposers("ARC/evaluation", random_permutation(decomposers));
  //await solve_with_decomposers("ARC/evaluation", default_decomposers_to_try);
  await solve_with_decomposers("ARC/evaluation", [...random_permutation(decomposers), ...default_decomposers_to_try]);
}

const worker_manger = new WorkerManager(8);

async function get_puzzle(path: string, name: string): Promise<ArcPuzzle> {
  const filename = `${path}/${name}`;
  console.log(`loading file ${filename}`);
  const puzzle: ArcPuzzle = await load_json(filename);
  puzzle.program_name = `client/AddedInfo/${name.split('.')[0]}.ts`;

  try {
    puzzle.program = await load_text(puzzle.program_name);  
  } catch (_e) {

  }

  return puzzle;
}

async function get_puzzle_program(puzzle: ArcPuzzle) {
  if (puzzle.program) {
    puzzle.program_transpiled = await ts.transpile(puzzle.program);
  }
}

async function get_puzzle_and_program(path: string, name: string) {
  const puzzle = await get_puzzle(path, name);

  await get_puzzle_program(puzzle);

  return puzzle;
}

async function solve_puzzle_with_clues_with_workers(path: string, name: string): Promise<ArcPuzzle> {
  return await worker_manger.enter(async () => {
    const puzzle = await get_puzzle_and_program(path, name);
    return await worker_manger.send_task({ task: 'solve_puzzle', puzzle });  
  });
}

async function solve_puzzle_trying_given_decomposers_with_workers(path: string, name: string, decomposers: { decomposer_input: Decomposer, decomposer_output: Decomposer}[]): Promise<ArcPuzzle> {
  return await worker_manger.enter(async () => {
    const puzzle = await get_puzzle_and_program(path, name);
    return await worker_manger.send_task({ task: 'solve_puzzle_trying_all_decomposers', puzzle, decomposers });  
  });
}

const thumbnails_div = new Div();
const main_div = new Div();
const count_div = new Div();
const solve_with_clues_button = new Button('Solve with clues', () => solve_with_clues());
main_div.appendChild(solve_with_clues_button);
const solve_training_button = new Button('Solve Training', () => solve_training());
main_div.appendChild(solve_training_button);
const solve_evaluation_button = new Button('Solve Evaluation', () => solve_evaluation());
main_div.appendChild(solve_evaluation_button);
main_div.appendChild(count_div);
main_div.appendChild(thumbnails_div);

const editor_div = new Div();
editor_div.element = document.getElementById('container') as HTMLDivElement;


const hidden_div = new Div();
hidden_div.appendChild(editor_div);

function show_thumnails() {
  body.content = main_div;
}

show_thumnails();

async function show_puzzle(puzzle: ArcPuzzle, puzzle_thumpnail: Container<Canvas>) {

  function make_canvas() {
    return make_puzzle_canvas(150, 20, 20, 10, puzzle);
  }

  const puzzle_element = new Container(make_canvas());

  async function compile() {
    const program = editor.getValue()
    await save(puzzle.program_name!, program);
    puzzle.program = program;
    await get_puzzle_program(puzzle);
    await solve_puzzle(puzzle);
    puzzle_element.content = make_canvas();
    puzzle_thumpnail.content = make_puzzle_thumbnail(puzzle);
  }

  async function save_thumbnail() {
    await save(puzzle.program_name!.slice(0, puzzle.program_name!.length - 2) + "png", await new Promise<Blob>(resolve => puzzle_thumpnail.content!.element.toBlob((data) => resolve(data!))));
  }

  const index_element = new Div();
  index_element.element.innerHTML = `${puzzle.index}`;

  body.content = new Table([[index_element, puzzle_element, new Table([[editor_div], [new Table([[new Button('Compile', compile), new Button('Save thumbnail', save_thumbnail)]])]])]]);

  puzzle_element.element.onclick = () => {
    save(puzzle.program_name!, editor.getValue());
    show_thumnails();
    puzzle_thumpnail.content?.element.scrollIntoView();
  }

  if (!editor) {
    editor = monaco.editor.create(document.getElementById("container")!, {
      value: "",
      language: "typescript",
    });
  }

  if (puzzle.program) {
    editor.setValue(puzzle.program!);
  } else {
    editor.setValue("// Solution...");
  }

}


function make_puzzle_thumbnail(puzzle: ArcPuzzle) {
  return make_puzzle_canvas(20, 2, 5, 15, puzzle);
}

let puzzles: ArcPuzzle[] = [];

let puzzles_decomposers: { input: Decomposer, output: Decomposer }[] = [];

async function solve_with_clues() {
  thumbnails_div.clearChildren();
  const puzzles_in_progress: (ArcPuzzle | 'in-progress')[] = [];

  const puzzles_file = await dir("ARC/training");

  let max_count = 1000;
  let puzzle_index = 0;

  const urlParams = new URLSearchParams(window.location.search);
  const puzzles_str = urlParams.get('puzzles');
  const puzzles_todo = puzzles_str? new Set(puzzles_str.split(',').map(indexstr => parseInt(indexstr))) : new Set();

  for (const name of puzzles_file) {
    puzzle_index++
    const current_puzzle_index = puzzle_index;
    const puzzle_index_in_puzzles_in_progress = puzzles_in_progress.length;

    if (puzzles_todo.size > 0 && !puzzles_todo.has(puzzle_index)) {
      continue;
    }

    if (max_count-- === 0) {
      break;
    }

    const puzzle_thumpnail = new Container<Canvas>();

    puzzle_thumpnail.element.style.display = 'inline-block';
    const index_element = new Div();
    index_element.element.innerHTML = `${puzzle_index}`;
    const table = new Table([[index_element, puzzle_thumpnail]], 'bottom');
    table.element.style.display = 'inline-block';
    thumbnails_div.appendChild(table);

    puzzles_in_progress.push('in-progress');

    solve_puzzle_with_clues_with_workers("ARC/training", name).then(puzzle => {
      puzzle.index = current_puzzle_index;
      puzzle_thumpnail.content = make_puzzle_thumbnail(puzzle);
      puzzle_thumpnail.element.onclick = () => show_puzzle(puzzle, puzzle_thumpnail);
      puzzles_in_progress[puzzle_index_in_puzzles_in_progress] = puzzle;
    })
  }

  while (true) {
    await new Promise(resolve => setTimeout(resolve, 100));
    let todo = 0;
    let blue_count = 0;
    let red_count = 0;
    let half_blue_count = 0;
    let first = -1;
    for (let i = 0; i < puzzles_in_progress.length; i++) {
      const puzzle = puzzles_in_progress[i];

      if (puzzle === 'in-progress') {
        if (todo === 0) {
          first = i+1;
        }
        todo++;
      } else {
        if (puzzle.type == 2) {
          if (puzzle.state === 'solved') {
            blue_count++;
          } else if (puzzle.state === 'half-solved') {
            half_blue_count++;
          } else {
            red_count++;
          }
        }             
      }
    }
    if (todo === 0) {
      count_div.element.innerHTML = `--- FINAL --- BLUE: ${blue_count}, HALF: ${half_blue_count}, RED: ${red_count}`;
      break;
    } else {
      count_div.element.innerHTML = `WORKING ON: ${first}, TODO: ${todo}, BLUE: ${blue_count}, HALF: ${half_blue_count}, RED: ${red_count}`;
    }
  }

  puzzles = puzzles_in_progress as ArcPuzzle[];

  const decomposers = puzzles.filter(puzzle => puzzle.state === 'solved' && puzzle.type === 2)
    .map(puzzle => { return { decomposer_input: puzzle.decomposer_input!, decomposer_output: puzzle.decomposer_output! } });

  save("client/decomposers.json", JSON.stringify(decomposers));

  /*const decomposer_map: Map<string, Decomposer> = new Map();

  for (const decomposer of decomposers) {
    decomposer_map.set(decomposer_to_key(decomposer.decomposer_input), decomposer.decomposer_input);
    decomposer_map.set(decomposer_to_key(decomposer.decomposer_output), decomposer.decomposer_output);
  }
  
  const all_decomposers_key = [...new Set([...decomposers.map(d => decomposer_to_key(d.decomposer_input)), ...decomposers.map(d => decomposer_to_key(d.decomposer_output))])];

  const new_decomposers: { decomposer_input: Decomposer, decomposer_output: Decomposer }[] = [];

  for (const input of all_decomposers_key) {
    for (const output of all_decomposers_key) {
      new_decomposers.push({ decomposer_input: decomposer_map.get(input)!, decomposer_output: decomposer_map.get(output)!});
    }
  }

  save("client/decomposers.json", JSON.stringify(new_decomposers));*/

  puzzles_decomposers = puzzles.filter(puzzle => puzzle.state === 'solved' && puzzle.type === 2)
    .map(puzzle => { return { input: puzzle.decomposer_input!, output: normalize_decomposer(puzzle.decomposer_output!) }; });

    analyser_decomposers();
}

function analyser_decomposers() {

  const roots = new Set();
  const different_roots = new Set();

  for (const decomposers of puzzles_decomposers) { 
    const input = decomposer_to_key(decomposer_root(decomposers.input)); 
    const output = decomposer_to_key(decomposer_root(decomposers.output)); 
    roots.add(input);
    roots.add(output);
    if (output !== 'none' && input !== output) {
      different_roots.add(`${input} -> ${output}`); 
    }
  }

  console.log('roots', [...roots]);
  console.log('different roots', [...different_roots]);

  const prefix = new Set();
  const different_prefix = new Set();

  for (const decomposers of puzzles_decomposers) { 
    const input = decomposer_to_key(decomposer_prefix(decomposers.input)); 
    const output = decomposer_to_key(decomposer_prefix(decomposers.output));
    prefix.add(input);
    prefix.add(output); 
    if (input !== output && input !== 'none' && output !== 'none') {
      different_prefix.add(`${input} -> ${output}`);
    } 
  }
  console.log('prefix', [...prefix]);
  console.log('different prefix', [...different_prefix]);

  const suffix = new Set();
  const different_suffix = new Set();

  for (const decomposers of puzzles_decomposers) { 
    const input = decomposer_to_key(decomposer_suffix(decomposers.input)); 
    const output = decomposer_to_key(decomposer_suffix(decomposers.output));
    suffix.add(input);
    suffix.add(output); 
    if (input !== output && input !== 'none' && output !== 'none') {
      different_suffix.add(`${input} -> ${output}`);
    } 
  }
  console.log('suffix', [...suffix]);
  console.log('different suffix', [...different_suffix]);

  const standalone = new Set();

  for (const decomposers of puzzles_decomposers) {
    if (!decomposer_root(decomposers.input)) {
      standalone.add(decomposer_to_key(decomposers.input));
    }
    if (!decomposer_root(decomposers.output)) {
      standalone.add(decomposer_to_key(decomposers.output));
    }
  }
  console.log('stand alone', [...standalone]);
}

async function solve_with_decomposers(path: string, decomposers: { decomposer_input: Decomposer, decomposer_output: Decomposer}[]) {
  thumbnails_div.clearChildren();

  console.log(`reading dir '${path}`);
  const puzzles_file = await dir(path);

  let max_count = 1000;
  let puzzle_index = 0;

  const urlParams = new URLSearchParams(window.location.search);
  const puzzles_str = urlParams.get('puzzles');
  const puzzles_todo = puzzles_str? new Set(puzzles_str.split(',').map(indexstr => parseInt(indexstr))) : new Set();

  const puzzles_in_progress: (ArcPuzzle | 'in-progress')[] = [];

  for (const name of puzzles_file) {
    puzzle_index++

    if (puzzles_todo.size > 0 && !puzzles_todo.has(puzzle_index)) {
      continue;
    }

    if (max_count-- === 0) {
      break;
    }


    const puzzle_thumpnail = new Container<Canvas>();
    
    puzzle_thumpnail.element.style.display = 'inline-block';
    const index_element = new Div();
    index_element.element.innerHTML = `${puzzle_index}`;
    const table = new Table([[index_element, puzzle_thumpnail]], 'bottom');
    table.element.style.display = 'inline-block';
    thumbnails_div.appendChild(table);

    const puzzles_in_progress_index = puzzles_in_progress.length;
    puzzles_in_progress.push('in-progress');

    solve_puzzle_trying_given_decomposers_with_workers(path, name, decomposers).then(puzzle => {
      puzzle.index = puzzle_index;
      puzzles_in_progress[puzzles_in_progress_index] = puzzle;
      puzzle_thumpnail.content = make_puzzle_thumbnail(puzzle)
      puzzle_thumpnail.element.onclick = () => show_puzzle(puzzle, puzzle_thumpnail);
    })
  }

  while (true) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    let todo = 0;
    let blue_count = 0;
    let red_count = 0;
    let first = -1;
    for (let i = 0; i < puzzles_in_progress.length; i++) {
      const puzzle = puzzles_in_progress[i];
      if (puzzle === 'in-progress') {
        if (todo === 0) {
          first = i+1;
        }
        todo++;
      } else {
        if (puzzle.state === 'solved') {
          blue_count++;
        } else {
          red_count++;
        }
      }
    }
    if (todo === 0) {
      count_div.element.innerHTML = `--- FINAL --- BLUE: ${blue_count}, RED: ${red_count}`;
      break;
    } else {
      count_div.element.innerHTML = `WORKING ON: ${first}, TODO: ${todo}, BLUE: ${blue_count}, RED: ${red_count}`;
    }
  }
}

(async () => {
  await init_editor();
  await solve_with_clues();
})();

