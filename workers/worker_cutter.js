importScripts('../app_modules/module_to_be_defined.js','../app_modules/linecutter.js');

let params = [[[600,10], [430,16], [1890,6], [1560,8], [1200,3], [943, 9], [320, 6]], 3000, 0];

let cutter = new LineCutter(...params);

onmessage = message => {
    let schemas = cutter.cutBasis('LONGEST');

    postMessage([schemas, schemas.reduce((acc,cur) => acc + cur.num, 0), schemas[schemas.length-1]]);    
}