importScripts('../app_modules/module_to_be_defined.js','../app_modules/linecutter.js');

let params = [[[600,5], [430,6], [890,1]], 3000, 4];

let cutter = new LineCutter(...params);

onmessage = message => {
    postMessage(cutter.getBestSchema(3000));
}