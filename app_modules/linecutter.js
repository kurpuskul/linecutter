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

        let fitDetails = this.fitTo(line);
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
                if(details[i].size > sum || details[i].curNum == 0) continue;

                details[i].take();

                let curChain = [...chain];
                curChain.push(details[i]);

                getChains(details, sum - details[i].size - this.saw, i, curChain);

                details[i].give();
            }
        }
            // Starting recursive function with array of details fit to the line length
        getChains(this.fitTo(line), line, 0, []);
            // returning array of Chains (len : sum of detail lengths with saws between them)
        return chains.map(detailSet => (new this.Chain(detailSet, detailSet.reduce((a,b) => a + b.size + this.saw, -this.saw))));
    }

    getBestChain(line, deviation = 0){
        if(!Number.isInteger(deviation)) throw new Error('Deviation is not an integer in getBestChain()');

        let allChains = this.getAllChains(line);
        if(!allChains) return false;

        let longestChain = allChains.sort((a,b) => b.len - a.len)[0].len;
        let longestChains = allChains.filter(chain => chain.len >= longestChain - deviation);

        longestChains.forEach(chain => {
            chain.details.sort((a,b) => b.size - a.size);
        })
            // Returning a chain that contains longest details inside by comparing detail lists as strings
        return longestChains.sort((a,b) => this.createStringFromDetails(a.details) > this.createStringFromDetails(b.details) ? -1 : 1)[0];
    }

    getBestSchema(line, deviation = 0){
        let bestChain = this.getBestChain(line, deviation);
        if(!bestChain) return false;


        let schema = new this.Schema();

        let currentDetail = null;
        let putToSchema = (detail) => {
            if(detail != currentDetail){
                schema.addUsage(new this.Usage(detail, 1), false);
                currentDetail = detail;
            } else {
                schema.usages.find(u => u.detail == detail).addNum();
            }
        }
        bestChain.details.forEach(putToSchema);

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
            bestSchema.usages[0].detail == longest ? bestSchema.usages[0].addNum() : bestSchema.addUsage(new this.Usage(longest));
        } else {
                // getBestSchema may return false if no detail fit to the rest length of line
                // In that case bestSchema will hold just the longest detail itself
            bestSchema = new this.Schema([new this.Usage(longest)], line, longest.size);
        }

        return bestSchema;     
    }

    countPossibleSchemas(schema){
        return Math.floor(Math.min(...schema.usages.map(usage => usage.detail.curNum/usage.num)));
    }

    setPossibleSchemasNum(schema){
        schema.num = this.countPossibleSchemas(schema);
        return schema;
    }

    takeDetailsOfSchema(schema){
        schema.usages.forEach(usage => {
            usage.detail.take(usage.num * schema.num);
        })
    }

    hasAnyDetail(){
        return this.details.some(detail => detail.curNum > 0);
    }

    cutBasis(mode){
        const schemas = [];

        let action = null;
        let args = [];

        if(mode === 'LONGEST'){
            action = 'getSchemaWithLongest';
            args = [this.basis];
        } else

        if(mode === 'BEST'){
            action = 'getBestSchema';
            args = [this.basis];
        } else 

        if(mode === 'BEST_LONGER'){
            action = 'getBestSchema';
            args = [this.basis, Math.floor(this.basis/100)];
        } else 

        if(mode === 'LONGEST_LONGER'){
            action = 'getSchemaWithLongest';
            args = [this.basis, Math.floor(this.basis/200)];
        }

        if(!action) return false;

        while(this.hasAnyDetail()){
            let schema = this[action](...args);
            this.setPossibleSchemasNum(schema);
            this.takeDetailsOfSchema(schema);
            schemas.push(schema);
        }

        return schemas;
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

    Chain = class {
        constructor(details, len){
            this.details = details;
            this.len = len;
        }
    }

    Usage = class {
        constructor(detail, num = 1){
            this.detail = detail;
            this.num = num;
        }

        addNum(num = 1){
            this.num += num;
        }
    }

    Schema = class {
        constructor(usages = [], totalLen=0, usedLen=0){
            this.usages = usages;
            this.totalLen = totalLen;
            this.usedLen = usedLen;
            this.num = 1;
        }

        addUsage(usage, first=true){
            if(first){
                this.usages.unshift(usage);
            } else {
                this.usages.push(usage);
            }
        }
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
            // Prefill the string by zeros if number is less than 10 signs
        let string = sizes.map(size => '0'.repeat(10 - size.toString().length) + size).join();
        return string;
    }

}

module.exports = LineCutter; // For testing by JEST
