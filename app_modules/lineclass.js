class LineClass {
    constructor(details, options = {basis : 3000, saw : 4, mode : 'LONGEST', tails : [], sizeToTail : 200, addons : []}) {
        this.details = this.createLines(details, 'detail').sort((a,b) => a.len - b.len);
        this.basis = new this.Line(options.basis, Infinity);
        this.saw = options.saw;
        this.mode = options.mode;
        this.tails = (!options.tails || !options.tails.length) ? null : this.createLines(options.tails, 'tail');
        this.sizeToTail = options.sizeToTail ? options.sizeToTail : 200;
        this.addons = (!options.addons || !options.addons.length) ? null : options.addons;
    }

    getAllChains(lineLen){

        let fitDetails = this.getDetailsFitTo(lineLen);
        if(!fitDetails) return false;

        let chains = [];
            // Recursive function to create tree of variations 
        let getChains = (details, sum, lastIndex, chain) => {
                // Chain from previous iteration of getChains
            if(chain.length != 0){
                chains.push(chain);
            }
                // Iterate recursively itself for all detail from the shortest one
                // ... on each step starting with last used detail
            for(let i = lastIndex; i < details.length; i++){
                    // Out of current iteration if left length of line is smaller than current detail
                    // ... or current detail doesn't have enough num to take
                if(details[i].len > sum || details[i].curNum == 0) continue;

                details[i].take();

                let curChain = [...chain];
                curChain.push(details[i]);

                getChains(details, sum - details[i].len - this.saw, i, curChain);

                details[i].give();
            }
        }
            // Starting recursive function with array of details fit to the line length
        getChains(this.getDetailsFitTo(lineLen), lineLen, 0, []);
            // returning array of Chains (len : sum of detail lengths with saws between them)
        return chains.map(detailSet => (new this.Chain(detailSet, detailSet.reduce((a,b) => a + b.len + this.saw, -this.saw))));
    }

    getBestChain(lineLen, deviation = 0){
        if(!Number.isInteger(deviation)) throw new Error('Deviation is not an integer in getBestChain()');

        let allChains = this.getAllChains(lineLen);
        if(!allChains) return false;

        let longestChainLen = allChains.sort((a,b) => b.len - a.len)[0].len;
        let longestChains = allChains.filter(chain => chain.len >= longestChainLen - deviation);

        longestChains.forEach(chain => {
            chain.details.sort((a,b) => b.len - a.len);
        })
            // Returning a chain that contains longest details inside by comparing detail lists as strings
        return longestChains.sort((a,b) => this.createStringFromDetails(a.details) > this.createStringFromDetails(b.details) ? -1 : 1)[0];
    }

    Line = class {
        constructor(len, num = 1, id = 0, type = 'basis'){
            this.len = len;
            this.initNum = num;
            this.curNum = num;
            this.id = id;
            this.type = type;
        }

        take(num = 1) {
            if(this.curNum - num >= 0) {
                this.curNum -= num;
            } else {
                throw new Error(`Not enough num to take ${this.type} with id ${this.id}`);
            }
        }

        give(num = 1) {
            if(this.curNum + num <= this.initNum) {
                this.curNum += num;
            } else {
                throw new Error(`Can't be more than initial num, when giving ${this.type} with id ${this.id}`);
            }
        }
    }

    createLines(lines, type = 'detail') {
        return lines.map(line => new this.Line(line[0], line[1], line[2], type));
    }

    Chain = class {
        constructor(details, len) {
            this.details = details;
            this.len = len;
        }
    }

    Usage = class {
        constructor(detail, num = 1) {
            this.detail = detail;
            this.num = num;
        }

        addNum(num = 1) {
            this.num += num;
        }
    }

    Schema = class {
        constructor(usages = [], totalLen=0, usedLen=0) {
            this.usages = usages;
            this.totalLen = totalLen;
            this.usedLen = usedLen;
            this.num = 1;
            this.line = this.basis;
        }

        addUsage(usage, first=true) {
            if(first) {
                this.usages.unshift(usage);
            } else {
                this.usages.push(usage);
            }
        }
    }

    getDetailsFitTo(size){
        if(!Number.isInteger(size)) throw new Error('Size is not an integer it fitTo(size)');
        let fitDetails = this.details.filter(d => d.len <= size && d.curNum > 0);
        if(!fitDetails.length) return false;
        return fitDetails;
    }

    getLongestDetail(size){
        let fitToSize = this.getDetailsFitTo(size);
        if(!fitToSize) return false;
        return fitToSize.sort((a,b) => b.len - a.len)[0];
    }

    createStringFromDetails(details){
        let sizes = details.map(det => det.len);
            // Prefill the string by zeros if number is less than 10 signs
        let string = sizes.map(size => '0'.repeat(10 - size.toString().length) + size).join();
        return string;
    }


}

let cutter = new LineClass([[300,2,1], [250, 5, 2], [450, 20, 3]], {basis: 3000, saw: 4, mode: 'LONGEST', tails : [[200, 4, 1]]});

console.log(cutter.getBestChain(2000, 100));