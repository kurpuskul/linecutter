let params = [[[600,30],[540,50],[390,200]], 27000, 4];
let cutter = new LineCutter(...params);

let withLongest = cutter.getSchemaWithLongest(1200);

console.log(withLongest);

let best = cutter.getBestSchema(1200, 40);

console.log(best);