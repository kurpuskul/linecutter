const worker_1 = new Worker("./app_modules/linecutter.js");
const worker_2 = new Worker("./app_modules/linecutter.js");
const worker_3 = new Worker("./app_modules/linecutter.js");

const params = [[[60,300],[54,500],[39,700]],8000,4];

worker_1.postMessage([params, 1]);
worker_2.postMessage([params, 2]);
worker_3.postMessage([params, 3]);

let count = 0;

console.time('Three');

worker_1.onmessage = message => {
    console.log('Thats 1: ', message.data);
    worker_1.terminate();
    count++;
    if(count === 3) console.timeEnd('Three');
}
worker_2.onmessage = message => {
    console.log('Thats 2: ', message.data);
    worker_2.terminate();
    count++;
    if(count === 3) console.timeEnd('Three');
}
worker_3.onmessage = message => {
    console.log('Thats 3: ', message.data);
    worker_3.terminate();
    count++;
    if(count === 3) console.timeEnd('Three');
}

console.log('Starting');

const worker_4 = new Worker("./app_modules/linecutter.js");


setTimeout(() => {
    console.time('Four');
    worker_4.postMessage([params, 1]);
    worker_4.postMessage([params, 2]);
    worker_4.postMessage([params, 3]);
}, 20000);


let result4 = [];
let count4 = 0;

worker_4.onmessage = message => {
    result4.push(message.data);
    count4++;
    if(count4 === 3){
        console.log('Thats4: ', result4);
        console.timeEnd('Four');
        worker_4.terminate();
    }
}