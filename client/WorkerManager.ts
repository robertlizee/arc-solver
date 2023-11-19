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

import { random_element, range } from "../lib/Misc";
import { Task, TaskResult } from "./WorkerTask";

export class WorkerManager {
    workers: Worker[];
    free_workers: Worker[];
    tasks_todo: { task: unknown, resolve: (y: unknown) => void }[] = [];
    actions_todo: (() => Promise<void>)[] = [];
    actions_working = 0;
    
    constructor(public worker_count: number) {
        this.workers = [...range(worker_count)].map(_ => new Worker('worker.js'));
        this.free_workers = [...this.workers];
        for (const worker of this.workers) {
            worker.onmessage = message => this.receive_task_result(worker, message);
        }
    }

    task_waiting: Map<string, (result: unknown) => void> = new Map();

    async enter<X>(action: () => Promise<X>): Promise<X> {
        return new Promise<X>(resolve => {
            this.actions_todo.push( async () => { const x = await action(); this.actions_working--; this.update(); resolve(x); });
            this.update();
        });
    }

    send_task<X, Y>(task: X): Promise<Y> {
    
        return new Promise(resolve => {
            this.tasks_todo.push({ task, resolve: y => resolve(y as Y) })
            this.update();
        })
    }

    update() {

        while (this.actions_todo.length > 0 && this.actions_working < 4*this.worker_count) {
            const action = this.actions_todo[0];
            this.actions_working++;
            this.actions_todo.splice(0, 1);
            action();
        }

        if (this.free_workers.length > 0 && this.tasks_todo.length > 0) {
            const id = crypto.randomUUID() as string;
    
            const worker = this.free_workers.pop()!;

            const task = this.tasks_todo[0];
            this.tasks_todo.splice(0, 1);

            worker.postMessage({ id, task: task.task } as Task<unknown>);
    
            this.task_waiting.set(id, task.resolve);
    
            console.log('post message to worker', { id, task }, worker);    
        }
    }
    
    receive_task_result = (worker: Worker, result: MessageEvent<TaskResult<unknown>>) => {
        this.free_workers.push(worker);
        const id = result.data.id;
        console.log('received message');
        console.log(result);
        if (this.task_waiting.has(id)) {
            console.log('found message');
            this.task_waiting.get(id)!(result.data.result);
            this.task_waiting.delete(id);
        }
        this.update();
    }

}
