class LineCutter{

    constructor(details, basis, saw, ends = 0, stores = [], bfirst = false){
        this.details = this.getDetails(details);
        this.basis = Number.isInteger(basis)? basis : NaN;
        this.saw = Number.isInteger(saw)? saw : NaN;
        this.ends = Number.isInteger(ends)? ends : NaN;
        this.stores = stores;
        this.bfirst = bfirst;
        this.schemas = [];

        if(Number.isNaN(this.basis) || Number.isNaN(this.saw) || Number.isNaN(this.ends)) throw new Error('Invalid arguments in LineCutter constructor');
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
        if(!Number.isInteger(deviation)) throw new Error('Deviation is not an integer in getBestChain()');
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
        return longestChains.sort((a,b) => this.createStringFromDetails(a.items) > this.createStringFromDetails(b.items) ? -1 : 1)[0];
    }

    getBestSchema(line, deviation = 0){
        let bestChain = this.getBestChain(line, deviation);
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

    getSchemaWithLongest(line, deviation = 0){
        let longest = this.getLongest(line);
        if(!longest) return false;

        longest.take();

        let bestSchema = this.getBestSchema(line - longest.size - this.saw, deviation);

        longest.give();

        if(bestSchema){
            bestSchema.totalLen += longest.size + this.saw;
            bestSchema.usedLen += longest.size + this.saw;
            bestSchema.usages[0].detail == longest ? bestSchema.usages[0].num++ :bestSchema.usages.unshift({detail : longest, num : 1});
        } else {
                // getBestSchema may return false if no detail fit to the rest length of line
                // In that case bestSchema will hold just the longest detail itself
            bestSchema = {usages: [{detail : longest, num : 1}], totalLen: line, usedLen: longest.size};
        }

        return bestSchema;     
    }
    
    
    
    Detail = class {
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
                throw new Error(`Can't take ${num} of detail (id:${this.id}, size: ${this.size}) because it's current num is ${this.curNum}`);
            }
        }
    
        give(num = 1){
            if(this.curNum + num <= this.initNum){
                this.curNum += num;
            } else {
                throw new Error(`Can't give ${num} to detail (id:${this.id}, size: ${this.size}) because it's initial num is ${this.initNum} and current num is ${this.curNum}`);
            }
        }
    }

    getDetails(detailsArr){
        if(!Array.isArray(detailsArr)) throw new Error('Incoming details should be an array');
        if(!detailsArr.every(pair => Array.isArray(pair))) throw new Error('Every item of incoming array of details should be an array');
        if(!detailsArr.every(pair => pair.length === 2)) throw new Error(`Every pair of incoming array of details should have two numbers, describing length and number of detail`);
        if(!detailsArr.every(pair => Number.isInteger(pair[0]) && Number.isInteger(pair[1]))) throw new Error(`Incoming array of details' pairs should contain integers only`);
        if(!detailsArr.every(pair => pair[1] > 0 && pair[1] < 1000)) throw new Error(`All of incoming details should have at least one and not more than 999 numbers`);
        return detailsArr.map((d, i) => new this.Detail(d[0], d[1], i)).sort((a,b) => a.size - b.size);
    }

    fitTo(line){
        if(!Number.isInteger(line)) throw new Error('Line is not an integer it fitTo(line)');
        let fitDetails = this.details.filter(d => d.size <= line && d.curNum > 0);
        if(!fitDetails.length) return false;
        return fitDetails;
    }

    getLongest(line){
        let fit_to_line = this.fitTo(line);
        if(!fit_to_line) return false;
        return this.fitTo(line).sort((a,b) => b.size - a.size)[0];
    }

    createStringFromDetails(details){
        let sizes = details.map(det => det.size);
        let string = sizes.map(size => '0'.repeat(6 - size.toString().length) + size).join();
        return string;
    }

}

module.exports = LineCutter; // For testing by JEST
