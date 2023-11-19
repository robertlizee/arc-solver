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


export class Element {
    element: HTMLElement;
    parent?: Element;
    children: Element[] = [];

    constructor(tagName: string) {
        this.element = document.createElement(tagName);
    }

    get visible() {
        return this.element.style.display == 'block';
    }

    set visible(value: boolean) {
        this.element.style.display = value? 'block': 'none';
    }

    appendChild(element: Element) {
        if (element.parent) {
        element.parent.children = element.parent.children.filter(child => child != element);
        }
        element.parent = this;
        this.children.push(element);
        this.element.appendChild(element.element);
    }

    clearChildren() {
        for (const child of this.children) {
        child.parent = undefined;
        }
        this.children.length = 0;
        this.element.innerHTML = '';
    }
}

export class Div extends Element {
    declare element: HTMLDivElement;

    constructor() {
        super('div');
    }
}

export class Canvas extends Element {
    declare element: HTMLCanvasElement;

    constructor() {
        super('canvas');
    }
}

export class Container<C extends Element> extends Element {
    _content?: C;

    constructor(content?: C, tagName = 'div') {
        super(tagName);
        if (content) {
            this.content = content;
        }
    }

    get content(): C | undefined {
        return this._content;
    }

    set content(c: C | undefined) {
        this.clearChildren();

        if (c) {
        this.appendChild(c);
        }

        this._content = c;
    }
}

export class Table extends Element {
    declare element: HTMLTableElement;

    constructor(public table: Element[][], alignment: 'top' | 'bottom' = 'top') {
        super('table');

        for (const row of table) {
            const tr = new Element('tr');
            this.appendChild(tr);

            for (const cell of row) {
                const th = new Container(cell, 'th');
                tr.appendChild(th);
                th.element.style.verticalAlign = alignment;
            }
        }
    }
}

export class Button extends Element {
    declare element: HTMLButtonElement;

    constructor(text: string, action: () => void) {
        super('button');
        this.element.textContent = text;
        this.element.onclick = action;
    }
}


export const body = new Container();

document.body.appendChild(body.element);

  