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

    function calcNeeds(rp, rc, rb, bp, bc, bb) {
        // pass 1 based on power
        let powerNeeded = bp;
        let capNeeded = powerNeeded / rp * rc;
        let barsNeeded = powerNeeded / rp * rb;

        // if current cap and bars are both less than needed, we're done
        if(bc <= capNeeded && bb <= barsNeeded) {
            return { power: powerNeeded - bp, cap: capNeeded - bc, bars: barsNeeded - bb };
        }

        // else, normalize accounting for ratio and biggest overage is used to calculate new power and re-calc needed
        let capDiffNormalized = (bc - capNeeded) / rc;
        let barsDiffNormalized = (bb - barsNeeded) / rb;

        if(capDiffNormalized < barsDiffNormalized) {
            powerNeeded = capNeeded / rc * rp;
        } else {
            powerNeeded = barsNeeded / rb * rp;
        }

        capNeeded = powerNeeded / rp * rc;
        barsNeeded = powerNeeded / rp * rb;

        return { power: powerNeeded - bp, cap: capNeeded - bc, bars: barsNeeded - bb };
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
        { label: "1 : 40k : 1", p: 1, c: 40000, b: 1 },
        { label: "1 : 40k : 2", p: 1, c: 40000, b: 2 },
        { label: "1 : 37.5k : 2.5", p: 1, c: 37500, b: 2.5 },
        { label: "3 : 75k : 2", p: 3, c: 75000, b: 2 },
        { label: "4 : 130k : 1", p: 4, c: 130000, b: 1 },
        { label: "custom", p: 0, c: 0, b: 0 }
    ];

    let vm = {
        pcbRatio_P: ko.observable(2).extend({persist: "pcbRatio_P"}),
        pcbRatio_C: ko.observable(75000).extend({persist: "pcbRatio_C"}),
        pcbRatio_B: ko.observable(5).extend({persist: "pcbRatio_B"}),
        ratioPresets: ratioPresets,
        selectedRatioPreset: ko.observable(),
        
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
        needs: {
            energy: {
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
        let rp = vm.pcbRatio_P();
        let rc = vm.pcbRatio_C();
        let rb = vm.pcbRatio_B();
        let bp = vm.base.energy.power();
        let bc = vm.base.energy.cap();
        let bb = vm.base.energy.bars();
        let needs = calcNeeds(rp, rc, rb, bp, bc, bb);

        vm.needs.energy.power(needs.power.toFixed(0));
        vm.needs.energy.cap(needs.cap.toFixed(0));
        vm.needs.energy.bars(needs.bars.toFixed(0));
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

    vm.EPexp = ko.computed(() => (vm.totalEnergyExpSpend() * vm.expPcts().EP).toFixed(0));
    vm.ECexp = ko.computed(() => (vm.totalEnergyExpSpend() * vm.expPcts().EC).toFixed(0));
    vm.EBexp = ko.computed(() => (vm.totalEnergyExpSpend() * vm.expPcts().EB).toFixed(0));
    vm.MPexp = ko.computed(() => (vm.totalMagicExpSpend() * vm.expPcts().MP).toFixed(0));
    vm.MCexp = ko.computed(() => (vm.totalMagicExpSpend() * vm.expPcts().MC).toFixed(0));
    vm.MBexp = ko.computed(() => (vm.totalMagicExpSpend() * vm.expPcts().MB).toFixed(0));
    vm.R3Pexp = ko.computed(() => (vm.totalR3ExpSpend() * vm.expPcts().R3P).toFixed(0));
    vm.R3Cexp = ko.computed(() => (vm.totalR3ExpSpend() * vm.expPcts().R3C).toFixed(0));
    vm.R3Bexp = ko.computed(() => (vm.totalR3ExpSpend() * vm.expPcts().R3B).toFixed(0));

    vm.EPamount = ko.computed(() => (vm.EPexp() / costs.EP).toFixed(0));
    vm.ECamount = ko.computed(() => (vm.ECexp() / costs.EC).toFixed(0));
    vm.EBamount = ko.computed(() => (vm.EBexp() / costs.EB).toFixed(0));
    vm.MPamount = ko.computed(() => (vm.MPexp() / costs.MP).toFixed(0));
    vm.MCamount = ko.computed(() => (vm.MCexp() / costs.MC).toFixed(0));
    vm.MBamount = ko.computed(() => (vm.MBexp() / costs.MB).toFixed(0));
    vm.R3Pamount = ko.computed(() => (vm.R3Pexp() / costs.R3P).toFixed(0));
    vm.R3Camount = ko.computed(() => (vm.R3Cexp() / costs.R3C).toFixed(0));
    vm.R3Bamount = ko.computed(() => (vm.R3Bexp() / costs.R3B).toFixed(0));

    ko.applyBindings(vm);
})();
