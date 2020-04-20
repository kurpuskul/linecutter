import { LineCutter } from './app_modules/linecutter.js';

let cut = new LineCutter([[600,4],[526,4],[432,9],[892,3]], 2700, 4);

console.log(cut.getBestSchema(2555));