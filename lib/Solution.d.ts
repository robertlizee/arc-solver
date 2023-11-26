import { Decomposer } from "./DecomposersData";
import { Grid } from "./Grid";
import { ConcreteImage } from "./ConcreteImage";
export declare function solution(decomposer: Decomposer, transform: (image: ConcreteImage) => ConcreteImage): {
    solver: (grid: Grid) => Grid;
};
export declare function solution2(decomposer_input: Decomposer, decomposer_output: Decomposer, transform?: (image: ConcreteImage) => ConcreteImage): {
    solver?: (grid: Grid) => Grid;
    decomposer_input: (grid: Grid) => ConcreteImage;
    decomposer_output: (grid: Grid) => ConcreteImage;
    decomposer_input_data: Decomposer;
    decomposer_output_data: Decomposer;
};
export declare function paint(decomposer: Decomposer): {
    painter: boolean;
    decomposer_input: (grid: Grid) => ConcreteImage;
};
export declare function evaluate_solver(code: string): {
    solver: (grid: Grid) => Grid;
    painter?: boolean;
    decomposer_input?: (grid: Grid) => ConcreteImage;
    decomposer_output?: (grid: Grid) => ConcreteImage;
    decomposer_input_data: Decomposer;
    decomposer_output_data: Decomposer;
};
