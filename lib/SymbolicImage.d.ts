import { Grid } from "./Grid";
import { NumberFunction, ColorFunction, GridFunction, SubImagesFunction } from "./Solver";
export declare class SymbolicImage {
    number_functions(): NumberFunction[];
    color_functions(): ColorFunction[];
    grid_functions(): GridFunction[];
    sub_images_functions(): SubImagesFunction[];
    to_grid(): Grid;
    grids(): Generator<Grid>;
}
