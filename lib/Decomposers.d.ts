import { Grid } from "./Grid";
import { BasicImage, ConcreteImage } from "./ConcreteImage";
import { Decomposer } from "./DecomposersData";
export declare function fbasic_grid(grid: Grid): BasicImage;
export declare function build_decomposer(decomposer: Decomposer): (grid: Grid) => ConcreteImage;
export declare function decomposer_to_list(decomposer: Decomposer): string[];
