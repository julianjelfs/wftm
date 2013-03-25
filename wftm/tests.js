describe("Warlock of firetop mountain", function() {
    
    var testState = {
        Initial : {
            Stamina : 20,
            Skill : 10,
            Luck : 9
        },
        Current : {
            Stamina : 18,
            Skill : 8,
            Luck : 8
        },
        Monsters : [{
            Skill: 6,
            Stamina: 6,
            Name: 'Monster 1',
            Dead: false,
            Luck : false,
            Status : ''
        },{
            Skill: 6,
            Stamina: 6,
            Name: 'Monster 2',
            Dead: false,
            Luck : false,
            Status : ''
        },{
            Skill: 6,
            Stamina: 6,
            Name: 'Monster 3',
            Dead: false,
            Luck : false,
            Status : ''
        }],
        Possessions : ["Map","Compass","Penknife"]
    }

    beforeEach(module('App'));
    
    describe("dice service", function() {
        var valid = [1, 2, 3, 4, 5, 6];
        it("should return a random value between 1 and 6", inject(function(dice) {
            expect(valid.indexOf(dice.roll())).not.toBe(-1);
            expect(valid.indexOf(dice.roll())).not.toBe(-1);
            expect(valid.indexOf(dice.roll())).not.toBe(-1);
        }));
    });

    describe("warlock controller", function() {
        var scope, localStorage = {
            isSupported : function (){},
            get : function (key){},
            remove : function (key){},
            add : function (key, val){}
        }, ctrl, dice = {roll : function (){}}, controller;

        beforeEach(inject(function($rootScope, $controller) {
            scope = $rootScope.$new();
            controller = $controller;
            spyOn(dice, "roll").andReturn(6);
        }));
        
        function verifyInitialSettings(obj) {
            expect(obj).not.toBe(null);
            expect(obj.Stamina).toEqual(24);
            expect(obj.Skill).toEqual(12);
            expect(obj.Luck).toEqual(12);
            expect(obj.Provisions).toBe(10);
        }
        
        function verifyCleanState() {
            expect(localStorage.isSupported).toHaveBeenCalled();
            verifyInitialSettings(scope.Current);
            verifyInitialSettings(scope.Initial);
            expect(scope.Monsters).not.toBe(null);
            expect(scope.Monsters.length).toBe(0);
            expect(scope.luckyOrNot.backgroundColor).toBe('none');
        }

        it("should initialise correctly when local storage not available", function() {
            spyOn(localStorage, "isSupported").andReturn(false);
            ctrl = new controller('WarlockCtrl', { $scope: scope, localStorageService: localStorage, dice : dice });
            verifyCleanState();
        });

        it("should initialise correctly when local storage is available but empty", function() {
            spyOn(localStorage, "isSupported").andReturn(true);
            spyOn(localStorage, "get").andReturn(null);
            ctrl = new controller('WarlockCtrl', { $scope: scope, localStorageService: localStorage, dice : dice });
            expect(localStorage.get).toHaveBeenCalled();
            verifyCleanState();
        });

        it("should load from local storage when available", function() {
            spyOn(localStorage, "isSupported").andReturn(true);
            spyOn(localStorage, "get").andReturn(JSON.stringify(testState));
            ctrl = new controller('WarlockCtrl', { $scope: scope, localStorageService: localStorage, dice : dice });
            expect(localStorage.get).toHaveBeenCalled();
            expect(scope.Current.Stamina).toEqual(18);
            expect(scope.Initial.Stamina).toEqual(20);
            expect(scope.Monsters.length).toEqual(3);
            expect(scope.Possessions.length).toEqual(3);
        });

        it("should report whether local storage is supported", function() {
            spyOn(localStorage, "isSupported").andReturn(true);
            ctrl = new controller('WarlockCtrl', { $scope: scope, localStorageService: localStorage, dice : dice });
            expect(scope.supportSave).not.toBe(null);
            expect(scope.supportSave()).toBe(true);
            expect(localStorage.isSupported).toHaveBeenCalled();
        });

        it("should test luck correctly when roll == luck", function() {
            spyOn(localStorage, "isSupported").andReturn(false);
            ctrl = new controller('WarlockCtrl', { $scope: scope, localStorageService: localStorage, dice : dice });
            scope.Current.Luck = 12;
            var lucky = scope.lucky();
            expect(lucky).toBe(true);
            expect(scope.Current.Luck).toBe(11);
            expect(scope.luckyOrNot.backgroundColor).toBe("#99ff66");
        });
        
        it("should test luck correctly when roll < luck", function() {
            spyOn(localStorage, "isSupported").andReturn(false);
            ctrl = new controller('WarlockCtrl', { $scope: scope, localStorageService: localStorage, dice : dice });
            scope.Current.Luck = 13;
            var lucky = scope.lucky();
            expect(lucky).toBe(true);
            expect(scope.Current.Luck).toBe(12);
            expect(scope.luckyOrNot.backgroundColor).toBe("#99ff66");
        });
        
        it("should test luck correctly when roll > luck", function() {
            spyOn(localStorage, "isSupported").andReturn(false);
            ctrl = new controller('WarlockCtrl', { $scope: scope, localStorageService: localStorage, dice : dice });
            scope.Current.Luck = 10;    
            var lucky = scope.lucky();
            expect(lucky).toBe(false);
            expect(scope.Current.Luck).toBe(9);
            expect(scope.luckyOrNot.backgroundColor).toBe("#ff6600");
        });

        it("should not test luck if current luck <= 0", function() {
            spyOn(localStorage, "isSupported").andReturn(false);
            ctrl = new controller('WarlockCtrl', { $scope: scope, localStorageService: localStorage, dice : dice });
            scope.Current.Luck = 0;
            scope.testLuck();
            expect(scope.Current.Luck).toBe(0);
            scope.Current.Luck = -1;
            scope.testLuck();
            expect(scope.Current.Luck).toBe(-1);
        });

        it("should clear local storage and initialise on calling newGame", function() {
            spyOn(localStorage, "isSupported").andReturn(false);
            spyOn(localStorage, "remove");
            ctrl = new controller('WarlockCtrl', { $scope: scope, localStorageService: localStorage, dice : dice });
            scope.newGame();
            expect(localStorage.remove).toHaveBeenCalledWith("wftmdata");
            verifyCleanState();
        });

        it("should not save state if local storage is not supported", function() {
            spyOn(localStorage, "isSupported").andReturn(false);
            spyOn(localStorage, "get");
            spyOn(localStorage, "add");
            spyOn(localStorage, "remove");
            ctrl = new controller('WarlockCtrl', { $scope: scope, localStorageService: localStorage, dice : dice });
            scope.save();
            expect(localStorage.isSupported).toHaveBeenCalled();
            expect(localStorage.get).not.toHaveBeenCalled();
            expect(localStorage.add).not.toHaveBeenCalled();
            expect(localStorage.remove).not.toHaveBeenCalled();
        });

        it("should record state in local storage on save", function() {
            spyOn(localStorage, "isSupported").andReturn(true);
            spyOn(localStorage, "get").andReturn(JSON.stringify(testState));
            spyOn(localStorage, "add");
            spyOn(localStorage, "remove");
            ctrl = new controller('WarlockCtrl', { $scope: scope, localStorageService: localStorage, dice : dice });
            scope.save();
            expect(localStorage.isSupported).toHaveBeenCalled();
            expect(localStorage.get).toHaveBeenCalledWith("wftmdata");
            expect(localStorage.remove).toHaveBeenCalledWith("wftmdata");
            expect(localStorage.add).toHaveBeenCalled();
        });

        it("should add a new monster with default values", function() {
            spyOn(localStorage, "isSupported").andReturn(false);
            ctrl = new controller('WarlockCtrl', { $scope: scope, localStorageService: localStorage, dice : dice });
            scope.addMonster();
            expect(scope.Monsters.length).toBe(1);
            var m = scope.Monsters[0];
            expect(m.Stamina).toBe(6);
            expect(m.Skill).toBe(6);
            expect(m.Name).toBe('Monster 0');
            expect(m.Dead).toBe(false);
            expect(m.Luck).toBe(false);
            expect(m.Status).toBe('');
        });
    });


});