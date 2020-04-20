export class LineCutter {

    constructor(details, basis, saw, ends = 0, stores = [], bfirst = false){
        this.details = this.getDetails(details);
        this.basis = basis;
        this.saw = saw;
        this.ends = ends;
        this.stores = stores;
        this.bfirst = bfirst;
        this.schemas = [];
    }
    
    getAllChains(line){
            // Get all details that fit to length of the line
        let fitDetails = this.fitTo(line);
            // If there is no details to cut return false immediately
        if(!fitDetails) return false;
            // Preparing an array for chains [details]
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
                if(details[i].size > sum || details[i].curNum == 0) continue;

                details[i].take();
                    // Coping the chain (to keep all variants)
                let curChain = [...chain];
                curChain.push(details[i]);
                    // Calling with new length left and current chain copy
                getChains(details, sum - details[i].size - this.saw, i, curChain);

                details[i].give();
            }
        }
            // Starting recursive function with array of details fit to the line length
        getChains(this.fitTo(line), line, 0, []);
            // returning structured chains : {items : details, len : sum of detail lengths with whole saw amount}
        return chains.map(v => ({items : v, len : v.reduce((a,b) => a + b.size + this.saw, -this.saw)}));
    }

    getBestChain(line, deviation = 0){
            // Getting set of chains for the line length
        let allChains = this.getAllChains(line);
            // Check if there chains to sort are
        if(!allChains) return false;
            // Taking longest chain length of the set
        let longestLen = allChains.sort((a,b) => b.len - a.len)[0].len;
            // Keep only best chains by length according to the longest one and deviation 
        let longestChains = allChains.filter(chain => chain.len >= longestLen - deviation);
            // Sort items (details) inside chains by length (longest first)
        longestChains.forEach(chain => {
            chain.items.sort((a,b) => b.size - a.size);
        })
            // Returning a chain that contains longest details inside by comparing one by one from start (using string comparing by symbols and filling to 6 ones by 0)
        return longestChains.sort((a,b) => a.items.map(i => this.fillByZero(i.size)).join() > b.items.map(i => this.fillByZero(i.size)).join() ? -1 : 1)[0];
    }

    getBestSchema(line){
        let bestChain = this.getBestChain(line, 0);
        if(!bestChain) return false;


        let schema = {usages: []};

        let currentDetail = null;
        let putToSchema = (detail) => {
            if(detail != currentDetail){
                schema.usages.push({detail: detail, num: 1});
                currentDetail = detail;
            } else {
                schema.usages.find(u => u.detail == detail).num++;
            }
        }
        bestChain.items.forEach(putToSchema);

        schema.totalLen = line;
        schema.usedLen = bestChain.len;
        return schema;
    }

    getLongSchema(line){
        let longest = this.getLongest(line);
        longest.take();
        let best = this.getBestSchema(line - longest.size - this.saw);
        longest.give();
        best.totLen += longest.size + this.saw;
        best.usedLen += longest.size + this.saw;
        best.usages[0].detail == longest ? best.usages[0].num++ :best.usages.push({detail : longest, num : 1});
        return best;
    }
    
    
    
    detailClass = class {
        constructor(size, num, id){
            this.size = size;
            this.initNum = num;
            this.curNum = num;
            this.id = id;
        }
    
        take(num = 1){
            if(this.curNum - num >= 0){
                this.curNum -= num;
            } else {
                console.error(`Can't take so much`);
            }
        }
    
        give(num = 1){
            if(this.curNum + num <= this.initNum){
                this.curNum += num;
            } else {
                console.error(`Can't turn so much`);
            }
        }
    }

    getDetails(detailsArr){
        return detailsArr.map((d, i) => new this.detailClass(d[0], d[1], i)).sort((a,b) => a.size - b.size);
    }

    fitTo(line){
        let fitDetails = this.details.filter(d => d.size <= line && d.curNum > 0);
        if(!fitDetails.length) return false;
        return fitDetails;
    }

    getLongest(line){
        return this.fitTo(line).sort((a,b) => b.size - a.size)[0];
    }

    fillByZero(size){
        return '0'.repeat(6 - size.toString().length) + size;
    }

}
