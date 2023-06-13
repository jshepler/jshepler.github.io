(function() {
    ko.options.deferUpdates = true;
    ko.extenders.persist = function(target, key) {
        // https://github.com/spoike/knockout.persist/blob/master/src/knockout.persist.js
        var initialValue = target();

        // Load existing value from localStorage if set
        if (key && localStorage.getItem(key) !== null) {
            try {
                initialValue = JSON.parse(localStorage.getItem(key));
            } catch (e) {
            }
        }
        
        target(initialValue);

        // Subscribe to new values and add them to localStorage
        target.subscribe(function (newValue) {
            localStorage.setItem(key, ko.toJSON(newValue));
        });
        
        return target;
    };

    function calcShouldBe(ratioPower, ratioCap, ratioBars, currentPower, currentCap, currentBars) {
        // pass 1 based on power
        let powerShouldBe = currentPower;
        let capShouldBe = powerShouldBe / ratioPower * ratioCap;
        let barsShouldBe = powerShouldBe / ratioPower * ratioBars;

        if(currentCap > capShouldBe || currentBars > barsShouldBe) {
            let capDiffNormalized = (currentCap - capShouldBe) / ratioCap;
            let barsDiffNormalized = (currentBars - barsShouldBe) / ratioBars;

            if(capDiffNormalized > barsDiffNormalized) {
                capShouldBe = currentCap;
                powerShouldBe = currentCap / ratioCap * ratioPower;
                barsShouldBe = powerShouldBe / ratioPower * ratioBars;
            } else {
                barsShouldBe = currentBars;
                powerShouldBe = currentBars / ratioBars * ratioPower;
                capShouldBe = powerShouldBe / ratioPower * ratioCap;
            }

            // capShouldBe = powerShouldBe / ratioPower * ratioCap;
            // barsShouldBe = powerShouldBe / ratioPower * ratioBars;
        }

        return {
            power: +powerShouldBe.toFixed(0),
            cap: +capShouldBe.toFixed(0),
            bars: +barsShouldBe.toFixed(0)
        }
    }

    let costs = {
        EP: 150,
        EC: (40 / 10000),
        EB: 80,
        MP: 450,
        MC: (120 / 10000),
        MB: 240,
        R3P: 15e+6,
        R3C: (4e+6 / 10000),
        R3B: 8e+6
    };

    let ratioPresets = [
        { label: "1 : 37.5k : 1", p: 1, c: 37500, b: 1 },
        { label: "1 : 37.5k : 2", p: 1, c: 37500, b: 2 },
        { label: "2 : 75k : 5", p: 2, c: 75000, b: 5 },
        { label: "3 : 75k : 2", p: 3, c: 75000, b: 2 },
        { label: "4 : 130k : 1", p: 4, c: 130000, b: 1 },
        { label: "custom", p: 0, c: 0, b: 0 }
    ];

    let fruitTierUpgradeMultipliers = [
        ["FoG", 1],
        ["FoPa", 10],
        ["FoA", 25],
        ["FoK", 40],
        ["Pom", 60],
        ["FoL", 100],
        ["FoPb", 150],
        ["FoAr", 170],
        ["FoN", 200],
        ["FoR", 2000],
        ["FoMa", 15000],
        ["FoPc", 30000],
        ["Wat", 50000],
        ["FoMb", 100000],
        ["FoQ", 25000],
        ["Mayo", 250000]
    ];

    let vm = {
        pcbRatio_P: ko.observable(2).extend({persist: "pcbRatio_P"}),
        pcbRatio_C: ko.observable(75000).extend({persist: "pcbRatio_C"}),
        pcbRatio_B: ko.observable(5).extend({persist: "pcbRatio_B"}),
        ratioPresets: ratioPresets,
        selectedRatioPreset: ko.observable(),
        fruits: fruitTierUpgradeMultipliers,
        fruitTiers: [...Array(25).keys()],
        selectedFruitMultiplier: ko.observable(),
        selectedFruitUpgradeFromTier: ko.observable(0),
        selectedFruitUpgradeToTier: ko.observable(10),
        totalDCPct: ko.observable(0).extend({persist: "totalDCPct"}),
        cubeRootDC: ko.observable(false).extend({persist: "cubeRootDC"}),
        itemBaseDCPct: ko.observable(0).extend({persist: "itemBaseDCPct"}),
        itemMaxDCPct: ko.observable(0).extend({persist: "itemMaxDCPct"}),
        
        base: {
            energy: {
                power: ko.observable(0).extend({persist: "base.energy.power"}),
                cap: ko.observable(0).extend({persist: "base.energy.cap"}),
                bars: ko.observable(0).extend({persist: "base.energy.bars"})
            },
            magic: {
                power: ko.observable(0).extend({persist: "base.magic.power"}),
                cap: ko.observable(0).extend({persist: "base.magic.cap"}),
                bars: ko.observable(0).extend({persist: "base.magic.bars"})
            },
            r3: {
                power: ko.observable(0).extend({persist: "base.r3.power"}),
                cap: ko.observable(0).extend({persist: "base.r3.cap"}),
                bars: ko.observable(0).extend({persist: "base.r3.bars"})
            }
        },
        shouldBe: {
            energy: {
                power: ko.observable(),
                cap: ko.observable(),
                bars: ko.observable()
            },
            magic: {
                power: ko.observable(),
                cap: ko.observable(),
                bars: ko.observable()
            },
            r3: {
                power: ko.observable(),
                cap: ko.observable(),
                bars: ko.observable()
            }
        },
        needs: {
            energy: {
                power: ko.observable(),
                cap: ko.observable(),
                bars: ko.observable()
            },
            magic: {
                power: ko.observable(),
                cap: ko.observable(),
                bars: ko.observable()
            },
            r3: {
                power: ko.observable(),
                cap: ko.observable(),
                bars: ko.observable()
            }
        },
        expNeeded: {
            energy: {
                power: ko.observable(),
                cap: ko.observable(),
                bars: ko.observable()
            },
            magic: {
                power: ko.observable(),
                cap: ko.observable(),
                bars: ko.observable()
            },
            r3: {
                power: ko.observable(),
                cap: ko.observable(),
                bars: ko.observable()
            }
        },
        totalEnergyExpSpend: ko.observable(1e+9).extend({persist: "totalEnergyExpSpend"}),
        totalMagicExpSpend: ko.observable(1e+9).extend({persist: "totalMagicExpSpend"}),
        totalR3ExpSpend: ko.observable(1e+9).extend({persist: "totalR3ExpSpend"})
    };

    vm.selectedRatioPreset.subscribe(v => {
        vm.pcbRatio_P(v.p);
        vm.pcbRatio_C(v.c);
        vm.pcbRatio_B(v.b);
    });

    ko.computed(() => {
        let rp = +vm.pcbRatio_P();
        let rc = +vm.pcbRatio_C();
        let rb = +vm.pcbRatio_B();
        let currentPower = +vm.base.energy.power();
        let currentCap = +vm.base.energy.cap();
        let currentBars = +vm.base.energy.bars();
        let shouldBe = calcShouldBe(rp, rc, rb, currentPower, currentCap, currentBars);

        vm.shouldBe.energy.power(shouldBe.power);
        vm.shouldBe.energy.cap(shouldBe.cap);
        vm.shouldBe.energy.bars(shouldBe.bars);

        vm.needs.energy.power(shouldBe.power - currentPower);
        vm.needs.energy.cap(shouldBe.cap - currentCap);
        vm.needs.energy.bars(shouldBe.bars - currentBars);

        vm.expNeeded.energy.power((shouldBe.power - currentPower) * costs.EP);
        vm.expNeeded.energy.cap((shouldBe.cap - currentCap) * costs.EC);
        vm.expNeeded.energy.bars((shouldBe.bars - currentBars) * costs.EB);
    });

    ko.computed(() => {
        let rp = +vm.pcbRatio_P();
        let rc = +vm.pcbRatio_C();
        let rb = +vm.pcbRatio_B();
        let currentPower = +vm.base.magic.power();
        let currentCap = +vm.base.magic.cap();
        let currentBars = +vm.base.magic.bars();
        let shouldBe = calcShouldBe(rp, rc, rb, currentPower, currentCap, currentBars);

        vm.shouldBe.magic.power(shouldBe.power);
        vm.shouldBe.magic.cap(shouldBe.cap);
        vm.shouldBe.magic.bars(shouldBe.bars);

        vm.needs.magic.power(shouldBe.power - currentPower);
        vm.needs.magic.cap(shouldBe.cap - currentCap);
        vm.needs.magic.bars(shouldBe.bars - currentBars);

        vm.expNeeded.magic.power((shouldBe.power - currentPower) * costs.MP);
        vm.expNeeded.magic.cap((shouldBe.cap - currentCap) * costs.MC);
        vm.expNeeded.magic.bars((shouldBe.bars - currentBars) * costs.MB);
    });

    ko.computed(() => {
        let rp = +vm.pcbRatio_P();
        let rc = +vm.pcbRatio_C();
        let rb = +vm.pcbRatio_B();
        let currentPower = +vm.base.r3.power();
        let currentCap = +vm.base.r3.cap();
        let currentBars = +vm.base.r3.bars();
        let shouldBe = calcShouldBe(rp, rc, rb, currentPower, currentCap, currentBars);

        vm.shouldBe.r3.power(shouldBe.power);
        vm.shouldBe.r3.cap(shouldBe.cap);
        vm.shouldBe.r3.bars(shouldBe.bars);

        vm.needs.r3.power(shouldBe.power - currentPower);
        vm.needs.r3.cap(shouldBe.cap - currentCap);
        vm.needs.r3.bars(shouldBe.bars - currentBars);

        vm.expNeeded.r3.power((shouldBe.power - currentPower) * costs.R3P);
        vm.expNeeded.r3.cap((shouldBe.cap - currentCap) * costs.R3C);
        vm.expNeeded.r3.bars((shouldBe.bars - currentBars) * costs.R3B);
    });

    vm.expPcts = ko.computed(() => {
        let ratioP = vm.pcbRatio_P(),
            ratioC = vm.pcbRatio_C(),
            ratioB = vm.pcbRatio_B();

        let expCosts = {
            EP: ratioP * costs.EP,
            EC: ratioC * costs.EC,
            EB: ratioB * costs.EB,
            MP: ratioP * costs.MP,
            MC: ratioC * costs.MC,
            MB: ratioB * costs.MB,
            R3P: ratioP * costs.R3P,
            R3C: ratioC * costs.R3C,
            R3B: ratioB * costs.R3B
        };

        let pctTotals = {
            E: expCosts.EP + expCosts.EC + expCosts.EB,
            M: expCosts.MP + expCosts.MC + expCosts.MB,
            R3: expCosts.R3P + expCosts.R3C + expCosts.R3B
        };

        return {
            EP: expCosts.EP / pctTotals.E,
            EC: expCosts.EC / pctTotals.E,
            EB: expCosts.EB / pctTotals.E,
            MP: expCosts.MP / pctTotals.M,
            MC: expCosts.MC / pctTotals.M,
            MB: expCosts.MB / pctTotals.M,
            R3P: expCosts.R3P / pctTotals.R3,
            R3C: expCosts.R3C / pctTotals.R3,
            R3B: expCosts.R3B / pctTotals.R3
        };
    });

    vm.EPexp = ko.computed(() => +(vm.totalEnergyExpSpend() * vm.expPcts().EP).toFixed(0));
    vm.ECexp = ko.computed(() => +(vm.totalEnergyExpSpend() * vm.expPcts().EC).toFixed(0));
    vm.EBexp = ko.computed(() => +(vm.totalEnergyExpSpend() * vm.expPcts().EB).toFixed(0));
    vm.MPexp = ko.computed(() => +(vm.totalMagicExpSpend() * vm.expPcts().MP).toFixed(0));
    vm.MCexp = ko.computed(() => +(vm.totalMagicExpSpend() * vm.expPcts().MC).toFixed(0));
    vm.MBexp = ko.computed(() => +(vm.totalMagicExpSpend() * vm.expPcts().MB).toFixed(0));
    vm.R3Pexp = ko.computed(() => +(vm.totalR3ExpSpend() * vm.expPcts().R3P).toFixed(0));
    vm.R3Cexp = ko.computed(() => +(vm.totalR3ExpSpend() * vm.expPcts().R3C).toFixed(0));
    vm.R3Bexp = ko.computed(() => +(vm.totalR3ExpSpend() * vm.expPcts().R3B).toFixed(0));

    vm.EPamount = ko.computed(() => +(vm.EPexp() / costs.EP).toFixed(0));
    vm.ECamount = ko.computed(() => +(vm.ECexp() / costs.EC).toFixed(0));
    vm.EBamount = ko.computed(() => +(vm.EBexp() / costs.EB).toFixed(0));
    vm.MPamount = ko.computed(() => +(vm.MPexp() / costs.MP).toFixed(0));
    vm.MCamount = ko.computed(() => +(vm.MCexp() / costs.MC).toFixed(0));
    vm.MBamount = ko.computed(() => +(vm.MBexp() / costs.MB).toFixed(0));
    vm.R3Pamount = ko.computed(() => +(vm.R3Pexp() / costs.R3P).toFixed(0));
    vm.R3Camount = ko.computed(() => +(vm.R3Cexp() / costs.R3C).toFixed(0));
    vm.R3Bamount = ko.computed(() => +(vm.R3Bexp() / costs.R3B).toFixed(0));

    vm.totalFruitUpgradeSeeds = ko.computed(() => {
        var multiplier = vm.selectedFruitMultiplier();
        var fromTier = vm.selectedFruitUpgradeFromTier();
        var toTier = vm.selectedFruitUpgradeToTier();
        var seeds = 0;

        for(var x = fromTier+1; x <= toTier; x++) seeds += x * x * multiplier;

        return seeds;
    });

    vm.effectiveDCPct = ko.computed(() => {
        let totalDCPct = +vm.totalDCPct() / 100.0;
        let cubeRootDC = vm.cubeRootDC();

        return cubeRootDC ? Math.cbrt(totalDCPct) : totalDCPct;
    });

    vm.itemCurrentDCPct = ko.computed(() => {
        let totalDC = +vm.effectiveDCPct();
        let baseDC = +vm.itemBaseDCPct() / 100.0;
        let maxDC = +vm.itemMaxDCPct() / 100.0;

        let currentDC = baseDC * totalDC;
        if(currentDC > maxDC && maxDC > 0) currentDC = maxDC;

        return Number((currentDC * 100.0).toFixed(2));
    });

    vm.needTotalDCPctForMax = ko.computed(() => {
        let baseDC = +vm.itemBaseDCPct() / 100.0;
        let maxDC = +vm.itemMaxDCPct() / 100.0;
        let cubeRootDC = vm.cubeRootDC();
        let pow = cubeRootDC ? 3 : 1;

        return Number(Math.pow((maxDC / baseDC) * 100.0, pow).toFixed(3));
    });

    vm.needTotalDCPctForMaxString = ko.computed(() => {
        let need = vm.needTotalDCPctForMax();

        if(need >= 1e+4) return need.toExponential(3) + "%";
        else return "" + need + "%";
    });

    ko.applyBindings(vm);
})();
