let worker = new Worker('./workers/worker_cutter.js');

worker.postMessage('Some');

worker.onmessage = message => {
    console.log(message.data);
}
