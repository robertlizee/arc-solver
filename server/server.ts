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

import { readdir } from "fs/promises";

const cert_file = Bun.file("certs/ARC_solver.crt");
const key_file = Bun.file("certs/ARC_solver.key");

const cert = await cert_file.exists()? cert_file : undefined;
const key = await key_file.exists()? key_file : undefined;

Bun.serve({
  port: 8000,
  async fetch(req) {
    const url = new URL(req.url);

    const files_to_build: { [file: string]: string } = {
      '/client.js': 'client/client.ts',
      '/worker/worker.ts': 'worker/worker.ts',
      '/service_worker.js': 'worker/service_worker.ts'
    }

    const file_to_build = files_to_build[url.pathname];

    if (file_to_build) {
      try {
        const result = await Bun.build({
          entrypoints: [file_to_build],
          format: 'esm',
          //sourcemap: 'inline'
        });

        if (result.success) {
          return new Response(result.outputs[0].stream(), {  headers: {
            "Content-Type": 'text/javascript',
            "Cache-Control": "no-store"
          }});
        } else {
          return new Response("500!")          
        }
        
      } catch (e) {
        console.error(e);
      }
    }

    if (url.pathname === "/") return new Response(Bun.file("public/index.html"));

    if (url.pathname.indexOf('..') < 0) {
      if (url.searchParams.get('ls')) {
        const files = await readdir(`public${url.pathname}`);
        return new Response(files.join('\n'));
      } else if (url.searchParams.get('save')) {
        if (url.pathname.startsWith('/client') && (url.pathname.endsWith('.ts') || url.pathname.endsWith('.json') )) {
          await Bun.write(`public${url.pathname}`, await new Response(req.body).blob());
          return new Response('ok');  
        } else {
          return new Response('404!')
        }
      } else {
        const file = Bun.file(`public${url.pathname}`);
        if (await file.exists()) {
          if (url.pathname.endsWith('.ts')) {
            return new Response(file, {  headers: {
              "Content-Type": 'text/typescript',
              "Cache-Control": "no-store"
            }});

          } else {
            return new Response(file);
          }
        } else {
          return new Response("404!");
        }  
      }
    } else {
      return new Response("404!");
    }
  },
  cert,
  key
});
