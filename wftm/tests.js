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
            isSupported : function () { return false; },
            get : function (key){},
            remove : function (key){},
            add : function (key, val){}
        }, ctrl, dice = {roll : function (){}}, controller, 
            win = {
                setInterval : function () { return 0; },
                clearInterval : function (handle){}
            };

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
            expect(obj.GoldCoins).toBe(0);
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
            spyOn(localStorage, "isSupported");
            ctrl = new controller('WarlockCtrl', { $scope: scope, $window: win, localStorageService: localStorage, dice : dice });
            verifyCleanState();
        });

        it("should initialise correctly when local storage is available but empty", function() {
            spyOn(localStorage, "isSupported").andReturn(true);
            spyOn(localStorage, "get").andReturn(null);
            ctrl = new controller('WarlockCtrl', { $scope: scope, $window: win, localStorageService: localStorage, dice : dice });
            expect(localStorage.get).toHaveBeenCalled();
            verifyCleanState();
        });

        it("should load from local storage when available", function() {
            spyOn(localStorage, "isSupported").andReturn(true);
            spyOn(localStorage, "get").andReturn(JSON.stringify(testState));
            ctrl = new controller('WarlockCtrl', { $scope: scope, $window: win, localStorageService: localStorage, dice : dice });
            expect(localStorage.get).toHaveBeenCalled();
            expect(scope.Current.Stamina).toEqual(18);
            expect(scope.Initial.Stamina).toEqual(20);
            expect(scope.Monsters.length).toEqual(3);
            expect(scope.Possessions.length).toEqual(3);
        });

        it("should report whether local storage is supported", function() {
            spyOn(localStorage, "isSupported").andReturn(true);
            ctrl = new controller('WarlockCtrl', { $scope: scope, $window: win, localStorageService: localStorage, dice : dice });
            expect(scope.supportSave).not.toBe(null);
            expect(scope.supportSave()).toBe(true);
            expect(localStorage.isSupported).toHaveBeenCalled();
        });

        it("should test luck correctly when roll == luck", function() {
            spyOn(localStorage, "isSupported");
            ctrl = new controller('WarlockCtrl', { $scope: scope, $window: win, localStorageService: localStorage, dice : dice });
            scope.Current.Luck = 12;
            var lucky = scope.lucky();
            expect(lucky).toBe(true);
            expect(scope.Current.Luck).toBe(11);
            expect(scope.luckyOrNot.backgroundColor).toBe("#99ff66");
        });
        
        it("should test luck correctly when roll < luck", function() {
            spyOn(localStorage, "isSupported");
            ctrl = new controller('WarlockCtrl', { $scope: scope, $window: win, localStorageService: localStorage, dice : dice });
            scope.Current.Luck = 13;
            var lucky = scope.lucky();
            expect(lucky).toBe(true);
            expect(scope.Current.Luck).toBe(12);
            expect(scope.luckyOrNot.backgroundColor).toBe("#99ff66");
        });
        
        it("should test luck correctly when roll > luck", function() {
            spyOn(localStorage, "isSupported");
            ctrl = new controller('WarlockCtrl', { $scope: scope, $window: win, localStorageService: localStorage, dice : dice });
            scope.Current.Luck = 10;    
            var lucky = scope.lucky();
            expect(lucky).toBe(false);
            expect(scope.Current.Luck).toBe(9);
            expect(scope.luckyOrNot.backgroundColor).toBe("#ff6600");
        });
        
        it("should allow manual dice roll", function() {
            spyOn(localStorage, "isSupported");
            ctrl = new controller('WarlockCtrl', { $scope: scope, $window: win, localStorageService: localStorage, dice : dice });
            expect(scope.manualRoll).toBe(undefined);
            scope.rollDice();
            expect(scope.manualRoll).not.toBe(undefined);
            expect(scope.manualRoll.roll1).toBe(6);
            expect(scope.manualRoll.roll2).toBe(6);
        });

        it("should not test luck if current luck <= 0", function() {
            spyOn(localStorage, "isSupported");
            ctrl = new controller('WarlockCtrl', { $scope: scope, $window: win, localStorageService: localStorage, dice : dice });
            scope.Current.Luck = 0;
            scope.testLuck();
            expect(scope.Current.Luck).toBe(0);
            scope.Current.Luck = -1;
            scope.testLuck();
            expect(scope.Current.Luck).toBe(-1);
        });

        it("should clear local storage and initialise on calling newGame", function() {
            spyOn(localStorage, "isSupported");
            spyOn(localStorage, "remove");
            ctrl = new controller('WarlockCtrl', { $scope: scope, $window: win, localStorageService: localStorage, dice : dice });
            scope.newGame();
            expect(localStorage.remove).toHaveBeenCalledWith("wftmdata");
            verifyCleanState();
        });

        it("should not save state if local storage is not supported", function() {
            spyOn(localStorage, "isSupported");
            spyOn(localStorage, "get");
            spyOn(localStorage, "add");
            spyOn(localStorage, "remove");
            ctrl = new controller('WarlockCtrl', { $scope: scope, $window: win, localStorageService: localStorage, dice : dice });
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
            ctrl = new controller('WarlockCtrl', { $scope: scope, $window: win, localStorageService: localStorage, dice : dice });
            scope.save();
            expect(localStorage.isSupported).toHaveBeenCalled();
            expect(localStorage.get).toHaveBeenCalledWith("wftmdata");
            expect(localStorage.remove).toHaveBeenCalledWith("wftmdata");
            expect(localStorage.add).toHaveBeenCalled();
        });

        it("should add a new monster with default values", function() {
            spyOn(localStorage, "isSupported");
            ctrl = new controller('WarlockCtrl', { $scope: scope, $window: win, localStorageService: localStorage, dice : dice });
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

        it("should not add empty possessions to the list", function() {
            ctrl = new controller('WarlockCtrl', { $scope: scope, $window: win, localStorageService: localStorage, dice : dice });
            scope.addPossession(null);
            expect(scope.Possessions.length).toBe(0);
        });

        it("should add a new possessions to the list", function() {
            ctrl = new controller('WarlockCtrl', { $scope: scope, $window: win, localStorageService: localStorage, dice : dice });
            scope.addPossession("map");
            expect(scope.Possessions.length).toBe(1);
            expect(scope.Possessions[0]).toBe("map");
            expect(scope.newPossession).toBe(null);
        });

        it("should delete monster by matching name", function() {
            ctrl = new controller('WarlockCtrl', { $scope: scope, $window: win, localStorageService: localStorage, dice : dice });
            scope.addMonster();
            scope.addMonster();
            scope.Monsters[0].Dead = true;
            expect(scope.Monsters[0].Name).toBe("Monster 0");
            expect(scope.Monsters.length).toBe(2);
            scope.deleteMonster(scope.Monsters[0]);
            expect(scope.Monsters.length).toBe(1);
            expect(scope.Monsters[0].Name).toBe("Monster 1");
        });

        it("should only delete a dead monster", function() {
            ctrl = new controller('WarlockCtrl', { $scope: scope, $window: win, localStorageService: localStorage, dice : dice });
            scope.addMonster();
            expect(scope.Monsters.length).toBe(1);
            scope.deleteMonster(scope.Monsters[0]);
            expect(scope.Monsters.length).toBe(1);  
        });

        it("should delete possessions correctly", function() {
            ctrl = new controller('WarlockCtrl', { $scope: scope, $window: win, localStorageService: localStorage, dice : dice });
            scope.addPossession("map");
            scope.addPossession("compass");
            scope.addPossession("penknife");
            expect(scope.Possessions.length).toBe(3);
            scope.deletePossession("compass");
            expect(scope.Possessions.length).toBe(2);
            expect(scope.Possessions.indexOf("compass")).toBe(-1);
        });

        it("should return the correct dice css class", function() {
            ctrl = new controller('WarlockCtrl', { $scope: scope, $window: win, localStorageService: localStorage, dice : dice });
            expect(scope.diceClass(1)).toBe("dice dice1");
            expect(scope.diceClass(6)).toBe("dice dice6");
        });

        it("should not be possible to exceed initial values for stamina, luck or skill", function() {
            ctrl = new controller('WarlockCtrl', { $scope: scope, $window: win, localStorageService: localStorage, dice : dice });
            function checkProp(prop) {
                scope.Current[prop] = 50;
                scope.changeVal(prop);
                expect(scope.Current[prop]).toBe(scope.Initial[prop]);
                scope.Current[prop] = 1;
                scope.changeVal(prop);
                expect(scope.Current[prop]).toBe(1);
            }
            checkProp("Stamina");
            checkProp("Skill");
            checkProp("Luck");  
        });

        it("should not be possible to decrease values below zero", function() {
            ctrl = new controller('WarlockCtrl', { $scope: scope, $window: win, localStorageService: localStorage, dice : dice });
            function checkProp(prop) {
                scope.Current[prop] = -1;
                scope.changeVal(prop);
                expect(scope.Current[prop]).toBe(0);
            }
            checkProp("Stamina");
            checkProp("Skill");
            checkProp("Luck");
        });

        it("should increase stamina if you eat provisions", function() {
            ctrl = new controller('WarlockCtrl', { $scope: scope, $window: win, localStorageService: localStorage, dice : dice });
            scope.Current.Stamina = 10;
            expect(scope.Current.Provisions).toBe(10);
            scope.eat();
            expect(scope.Current.Provisions).toBe(9);
            expect(scope.Current.Stamina).toBe(14); 
        });

        it("should not be possible to eat if you have no provisions", function() {
            ctrl = new controller('WarlockCtrl', { $scope: scope, $window: win, localStorageService: localStorage, dice : dice });
            scope.Current.Stamina = 10;
            scope.Current.Provisions = 0;
            scope.eat();
            expect(scope.Current.Provisions).toBe(0);
            expect(scope.Current.Stamina).toBe(10); 
        });
        
        it("should not be possible to eat if you have max stamina", function() {
            ctrl = new controller('WarlockCtrl', { $scope: scope, $window: win, localStorageService: localStorage, dice : dice });
            scope.eat();
            expect(scope.Current.Provisions).toBe(10);
            expect(scope.Current.Stamina).toBe(24);
        });
        
        it("should not be possible to exceed max stamina by eating", function() {
            ctrl = new controller('WarlockCtrl', { $scope: scope, $window: win, localStorageService: localStorage, dice : dice });
            scope.Current.Stamina = 22;
            scope.eat();
            expect(scope.Current.Provisions).toBe(9);
            expect(scope.Current.Stamina).toBe(24);
        });

        describe("monster battling", function() {
            var monster;
            
            beforeEach(function() {
                ctrl = new controller('WarlockCtrl', { $scope: scope, $window: win, localStorageService: localStorage, dice : dice });
                scope.addMonster();
                monster = scope.Monsters[0];
            });

            it("should reduce stamina by 2 if you are wounded by the monster", function() {
                monster.Skill = 50; //no way we can win
                expect(scope.Current.Stamina).toBe(24);
                scope.fightMonster(monster);
                expect(scope.Current.Stamina).toBe(22);
                expect(monster.Stamina).toBe(6);
                expect(monster.Status).toBe("Boo the monster wounded you!");
            });
            
            it("should reduce monster stamina by 2 if you wound the monster", function() {
                expect(scope.Current.Stamina).toBe(24);
                expect(monster.Stamina).toBe(6);
                scope.fightMonster(monster);
                expect(scope.Current.Stamina).toBe(24);
                expect(monster.Stamina).toBe(4);
                expect(monster.Status).toBe("Hurrah you wounded the monster!");
            });
            
            it("should record the monster as dead if its stamina < 0", function() {
                monster.Stamina = 2;
                expect(monster.Dead).toBe(false);
                scope.fightMonster(monster);
                expect(monster.Stamina).toBe(0);
                expect(monster.Dead).toBe(true);
                expect(monster.Status).toBe("Hurrah you killed the monster");
            });

            it("should automatically test luck if the monster kills us", function() {
                monster.Skill = 50;
                scope.Current.Stamina = 2;
                expect(scope.Current.Luck).toBe(12);
                scope.fightMonster(monster);
                expect(scope.Current.Stamina).toBe(1);
                expect(scope.Current.Luck).toBe(11);
            });

            it("should allow me to mitigate injury using luck if I'm lucky", function() {
                monster.Skill = 50; //no way we can win
                scope.fightMonster(monster);
                expect(scope.Current.Stamina).toBe(22);
                expect(monster.Round.TestLuck).not.toBe(undefined);
                monster.Round.TestLuck();
                expect(scope.Current.Stamina).toBe(23);
                expect(scope.Current.Luck).toBe(11);
                expect(monster.Round.Complete).toBe(true);
            });
            
            it("should fail to mitigate injury using luck if I'm not lucky", function() {
                monster.Skill = 50; //no way we can win
                scope.Current.Luck = 2;
                scope.fightMonster(monster);
                expect(scope.Current.Stamina).toBe(22);
                expect(monster.Round.TestLuck).not.toBe(undefined);
                monster.Round.TestLuck();
                expect(scope.Current.Stamina).toBe(22);
                expect(scope.Current.Luck).toBe(1);
                expect(monster.Round.Complete).toBe(true);
            });
            
            it("should not allow me to use luck if I don't have any", function() {
                monster.Skill = 50; //no way we can win
                scope.Current.Luck = 0;
                scope.fightMonster(monster);
                expect(monster.Round.TestLuck).toBe(undefined);
            });
            
            it("should allow me to compound monster injury using luck if I'm lucky", function() {
                scope.fightMonster(monster);
                expect(monster.Stamina).toBe(4);
                expect(monster.Round.TestLuck).not.toBe(undefined);
                monster.Round.TestLuck();
                expect(monster.Stamina).toBe(2);
                expect(scope.Current.Luck).toBe(11);
                expect(monster.Round.Complete).toBe(true);
            });
            
            it("should fail to compound monster injury using luck if I'm not lucky", function() {
                scope.Current.Luck = 2;
                scope.fightMonster(monster);
                expect(monster.Stamina).toBe(4);
                expect(monster.Round.TestLuck).not.toBe(undefined);
                monster.Round.TestLuck();
                expect(monster.Stamina).toBe(4);
                expect(scope.Current.Luck).toBe(1);
                expect(monster.Round.Complete).toBe(true);
            });

        });
    });


});