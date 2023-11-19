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

export function eqSet<X>(a: Set<X>, b: Set<X>): boolean {
    if (a.size === b.size) {
        for (const element of a.values()) {
            if (!b.has(element)) {
                return false;
            }
        }
        return true;
    } else {
        return false;
    }
}

export function set_equal<X>(a: Set<X>, b: Set<X>): boolean {
    if (a.size === b.size) {
        for (const element of a.values()) {
            if (!b.has(element)) {
                return false;
            }
        }
        return true;
    } else {
        return false;
    }
}

export function set_union<X>(...all_sets: Set<X>[]) {
    const result = new Set<X>();
    for (const set of all_sets) {
        for (const x of set) {
            result.add(x);
        }
    }

    return result;
}

export function set_intersection_equal<X>(a: Set<X>, b: Set<X>) {
    for (const v of a) {
        if (!b.has(v)) {
            a.delete(v);
        }
    }
}

export function set_intersection<X>(...rest: Set<X>[]) {
    const result = new Set(rest[0]);

    for (let i = 1; i < rest.length; i++) {
        set_intersection_equal(result, rest[i]);
    }

    return result;
}

export function count<A>(list: A[], test: (a: A) => boolean) {
    let result = 0;

    for (const a of list) {
        if (test(a)) {
            result++;
        }
    }

    return result;
}

export function functionRaiser<A, B, T>(t: (b: B) => A): (f: (a: A, ...indices: number[]) => T) => ((b: B, ...indices: number[]) => T) {
    return (f: (a: A, ...indices: number[]) => T) => ((b: B, ...indices: number[]) => f(t(b), ...indices));
}

export function highest<X>(objs: X[] | Set<X>, func: (x: X) => number): X | undefined {
    let best_value = -Infinity;
    let best_x: X | undefined = undefined;

    for (const x of objs) {
        const value = func(x);
        if (value > best_value) {
            best_value = value;
            best_x = x;
        }
    }

    return best_x;
}

export function lowest<X>(objs: X[] | Set<X>, func: (x: X) => number): X | undefined {
    let best_value = Infinity;
    let best_x: X | undefined = undefined;

    for (const x of objs) {
        const value = func(x);
        if (value < best_value) {
            best_value = value;
            best_x = x;
        }
    }

    return best_x;
}

export function highests<X>(objs: X[] | Set<X>, func: (x: X) => number): X[] {
    let best_value = -Infinity;
    let best_xs: X[] = [];

    for (const x of objs) {
        const value = func(x);
        if (value === best_value) {
            best_xs.push(x);
        } else if (value > best_value) {
            best_value = value;
            best_xs = [x];
        }
    }

    return best_xs;
}

export function lowests<X>(objs: X[] | Set<X>, func: (x: X) => number): X[] {
    let best_value = Infinity;
    let best_xs: X[] = [];

    for (const x of objs) {
        const value = func(x);
        if (value === best_value) {
            best_xs.push(x);
        } else if (value < best_value) {
            best_value = value;
            best_xs = [x];
        }
    }

    return best_xs;
}

export function select<X>(objs: X[] | Set<X>, test: (x: X) => boolean): X | undefined {
    for (const x of objs) {
        if (test(x)) {
            return x;
        }
    }
}

export function selects<X>(objs: X[] | Set<X>, test: (x: X) => boolean): X[] {
    const result: X[] = [];
    for (const x of objs) {
        if (test(x)) {
            result.push(x);
        }
    }

    return result;
}

export function count_items<X>(objs: X[]): Map<X, number> {
    const x_map = new Map<X, number>();
    for (const obj of objs) {
        if (x_map.has(obj)) {
            x_map.set(obj, x_map.get(obj)! + 1);
        } else {
            x_map.set(obj, 1);
        }
    }

    return x_map;
}

export function make_permutation_set(n: number): Set<number[]> {
    if (n < 1) {
        return new Set();
    } else if (n === 1) {
        return new Set([[0]]);
    } else {
        const result: Set<number[]> = new Set();
        const base = make_permutation_set(n-1);

        for (let i = 0; i < n; i++) {
            for (const elem of base) {
                result.add([...elem.slice(0, i), n-1, ...elem.slice(i)])
            }
        }

        return result;
    }
}

export function count_bits(n: bigint) {
    if (n < 0n) {
        return Infinity;
    } else {
        let count = 0;
        while (n > 0n) {
            n &= n - 1n;
            count++;
        }
        return count;
    }
}

export function bitfield_to_string(bitfield: bigint) {
    let output = "";

    while (bitfield > 0n) {
        output += (bitfield & 1n) === 0n? "0" : "1";
        bitfield = bitfield >> 1n;
    }

    return output;
}

export function booleans_to_bitfield(values: boolean[]) {
    let result = 0n;
    for (let i = 0; i < values.length; i++) {
        if (values[i]) {
            result |= 1n << BigInt(i);
        }
    }
    return result;
}

export function append_vectors<X>(...vectors: X[][]): X[] {
    const result: X[] = [];

    for (const vector of vectors) {
        for (const elem of vector) {
            result.push(elem);
        }
    }
    
    return result;
}

export function all<X>(v: X[], test: (x: X) => boolean) {
    for (const x of v) {
        if (!test(x)) {
            return false;
        }
    }

    return true;
}

export function* range(n: number) {
    for (let i = 0; i < n; i++) {
        yield i;
    }
}

export function *first_n<X>(n: number, generator: Generator<X>): Generator<X> {
    for (const x of generator) {
        yield x;
        if (--n <= 0) {
            return;
        }
    }
}

export class GenericError<T> {
    constructor(public message: string, public data: T) {}
}

export function operator_v<T>(oper: (a: T, b: T) => T) {
    return (v: T[]) => {
        if (v.length === 0) {
            throw new Error('Expecting at least 1 argument for oper_v');
        } else {
            let x = v[0];

            for (let i = 1; i < v.length; i++) {
                x = oper(x, v[i]);
            }

            return x;
        }
    }
}

export const bitfield_or_v = operator_v((a: bigint, b: bigint) => a | b);
export const bitfield_and_v = operator_v((a: bigint, b: bigint) => a & b);

export function random_permutation<X>(list: X[]): X[] {
    const working_copy = [...list];
    const result: X[] = [];

    while (working_copy.length > 0) {
        const index = Math.floor(Math.random() * working_copy.length);
        result.push(working_copy[index]);
        working_copy.splice(index, 1);
    }

    return result;
}

export function random_element<X>(xs: X[]): X | undefined {
    if (xs.length > 0) {
        return xs[Math.floor(Math.random() * xs.length)]
    }
}