﻿var app = angular.module("App", ["LocalStorageModule"]);

app.factory("dice", function() {
    return {
        roll: function() {
            var min = 1;
            var max = 6;
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }
    };
});

app.directive("monster", function() {
    return {
        restrict : "E",
        replace : true,
        templateUrl : "Templates/monster.html"
    }
});

app.directive("ngModal", function() {
    return {
        replace : true,
        scope : {
            title : "@",
            content : "@",
            dismissButton : "@",
            localModel : "&ngModal",
            dismiss : "&"
        },
        template : "<div class='modal hide fade'><div class='modal-header'><h3>{{title}}</h3></div><div class='modal-body'><p>{{content}}</p></div><div class='modal-footer'><a class='btn btn-danger' ng-click='close()'>{{dismissButton}}</a></div></div>",
        link : function(scope, elem) {
            scope.$watch(scope.localModel, function(newVal) {
                if (newVal <= 0) {
                    elem.modal("show");
                }
            });
            scope.close = function() {
                elem.modal("hide");
                scope.dismiss();
            }
        }
    }
});

app.controller("WarlockCtrl", function($scope, $window, $timeout, localStorageService, dice) {
    var autoSaveHandler;
    if (localStorageService.isSupported()) {
        var data = localStorageService.get("wftmdata");
        if (data != null) {
            data = JSON.parse(data);
            $scope.Initial = data.Initial;
            $scope.Current = data.Current;
            $scope.Monsters = data.Monsters;
            $scope.Possessions = data.Possessions;
            //initialiseAutosave();
        } else {
            initialise();
        }
    } else {
        initialise();
    }

    function initialiseAutosave() {
        if (autoSaveHandler != null) {
            $window.clearInterval(autoSaveHandler);
        }
        autoSaveHandler = $window.setInterval(function() { $scope.save(); }, 1000);
    }
    
    $scope.mainStyle = function() {
        if ($scope.Current.Stamina > 2) {
            return { backgroundColor : "auto"};
        }
        if ($scope.Current.Stamina == 2) {
            return { backgroundColor: "#ff9999" };
        }
        if ($scope.Current.Stamina == 1) {
            return { backgroundColor: "#ff0000" };
        }
    }

    $scope.supportSave = function(){
        return localStorageService.isSupported();
    }

    $scope.testLuck = function(){
        if($scope.Current.Luck <= 0)
            return;

        $scope.lucky();
    }
    
    $scope.rollDice = function() {
        $scope.manualRoll = {
            roll1 : dice.roll(),
            roll2 : dice.roll()
        }
    }

    $scope.lucky = function(){
        $scope.luckScore = {
            roll1 : dice.roll(),
            roll2 : dice.roll()
        }
        var luck = $scope.Current.Luck;
        $scope.Current.Luck -= 1;
        var wasLucky = ($scope.luckScore.roll1 + $scope.luckScore.roll2) <= luck;
        $scope.luckyOrNot = {backgroundColor : wasLucky ? "#99ff66" : "#ff6600"};
        return wasLucky;
    }

    $scope.newGame = function(){
        localStorageService.remove("wftmdata");
        initialise();
    }
            
    $scope.save = function() {
        if (localStorageService.isSupported()) {
            var data = {
                Initial : $scope.Initial,
                Current : $scope.Current,
                Monsters : $scope.Monsters,
                Possessions : $scope.Possessions
            }
            if(localStorageService.get("wftmdata") != null){
                localStorageService.remove("wftmdata");
            }
            localStorageService.add("wftmdata", JSON.stringify(data));
        }
    }
    
    function initialise() {
        $scope.Initial = {
            Stamina: dice.roll() + dice.roll() + 12,
            Skill: dice.roll() + 6,
            Luck: dice.roll() + 6,
            Provisions: 10,
            GoldCoins : 0
        };
        
        $scope.Monsters = [];
        $scope.Possessions = [];
        $scope.Current = angular.copy($scope.Initial);
        $scope.luckyOrNot = {backgroundColor : 'none'};
        //initialiseAutosave();
    }
    
    $scope.intro = function() {
        //we need to tag up a monster entry with help strings
        var monster, addedMonster = false;
        function kickOffTutorial() {
            monster = angular.element("div.monster:first");
            
            var monsterName = angular.element("div.row-fluid:eq(1) div:eq(0)", monster);
            monsterName.attr("data-step", "11");
            monsterName.attr("data-intro", "Enter a name for your monster if you like");
            
            var monsterSkill = angular.element("div.row-fluid:eq(1) div:eq(1)", monster);
            monsterSkill.attr("data-step", "12");
            monsterSkill.attr("data-intro", "Enter the skill score for this monster");
            
            var monsterStamina = angular.element("div.row-fluid:eq(1) div:eq(2)", monster);
            monsterStamina.attr("data-step", "13");
            monsterStamina.attr("data-intro", "Enter the stamina score for this monster");
            
            var fight = angular.element("div.row-fluid:eq(1) div:eq(3)", monster);
            fight.attr("data-step", "14");
            fight.attr("data-intro", "Click here to fight! You attack scores will be calculated automatically and your stamina scores automatically adjusted according to who wins the round. After the round, you can also test your luck to modify the results of the round. If you kill the monster, click delete to remove the row.");
        
            introJs().oncomplete(function() {
                if (addedMonster) {
                    $scope.$apply(function() {
                        $scope.Monsters = [];
                    });
                }
            }).start();
        }
        
        if ($scope.Monsters.length === 0) {
            $scope.addMonster();
            addedMonster = true;
            $timeout(kickOffTutorial, 0);
        } else {
            kickOffTutorial();
        }
            
    }

    $scope.addMonster = function() {
        $scope.Monsters.push({
            Skill: 6,
            Stamina: 6,
            Name: 'Monster ' + $scope.Monsters.length,
            Dead: false,
            Luck : false,
            Status : ''
        });
    }

    $scope.addPossession = function(possession){
        if(possession == null)
            return;
        $scope.Possessions.push(possession);
        $scope.newPossession = null;
    }

    $scope.deleteMonster = function(monster) {
        if(!monster.Dead)
            return;

        var index = -1;
        angular.forEach($scope.Monsters, function(m, i) {
            if (m.Name == monster.Name) {
                index = i;
            }
        });
        if (index >= 0) {
            $scope.Monsters.splice(index, 1);
        }
    }


    $scope.deletePossession = function(possession){
        var index = $scope.Possessions.indexOf(possession);
        if(index >= 0){
            $scope.Possessions.splice(index, 1);
        }
    }

    $scope.diceClass = function(num) {
        return "dice dice" + num;
    }

    $scope.fightMonster = function(monster) {
        if (monster.Dead)
            return;

        monster.Round = {
            you: {
                roll1: dice.roll(),
                roll2: dice.roll()
            },
            monster: {
                roll1: dice.roll(),
                roll2: dice.roll()
            },
            Complete : false
        }
        monster.Status = "";

        monster.Round.you.score = monster.Round.you.roll1 + monster.Round.you.roll2 + $scope.Current.Skill;
        monster.Round.monster.score = monster.Round.monster.roll1 + monster.Round.monster.roll2 + monster.Skill;


        if (monster.Round.you.score > monster.Round.monster.score) {
            monster.Stamina -= 2;
            if (monster.Stamina <= 0) {
                monster.Dead = true;
                monster.Status = 'Hurrah you killed the monster';
            } else {
                monster.Status = 'Hurrah you wounded the monster!'; 
                if($scope.Current.Luck > 0){
                    monster.Round.TestLuck = function(){
                        if (monster.Round.Complete)
                            return;
                        
                        if($scope.lucky()){
                            monster.Stamina -= 2;
                            monster.Status = "You were lucky!";
                        } else {
                            monster.Status = "You were not lucky this time";
                        }
                        monster.Round.Complete = true;
                    }
                }
            }
        }

        if (monster.Round.you.score < monster.Round.monster.score) {
            $scope.Current.Stamina -= 2;
            if($scope.Current.Luck > 0){
                monster.Round.TestLuck = function() {
                    if (monster.Round.Complete)
                        return;
                    if($scope.lucky()){
                        $scope.Current.Stamina += 1;
                        monster.Status = "You were lucky!";
                    } else {
                        monster.Status = "You were not lucky this time";
                    }
                    monster.Round.Complete = true;
                }
            }

            if ($scope.Current.Stamina > 0) {
                monster.Status = 'Boo the monster wounded you!';
            } else {
                //we are dead at this point. If we have any luck left we should try 
                //testing our luck automatically because it may save our life
                if(monster.Round.TestLuck != null)
                    monster.Round.TestLuck();
            }
        }

        if (monster.Round.you.score == monster.Round.monster.score) {
            monster.Status = "Your attack scores were equal - fight again";
        }
    }

    $scope.changeVal = function(prop) {
        if ($scope.Current[prop] > $scope.Initial[prop]) {
            $scope.Current[prop] = $scope.Initial[prop];
        }
        if ($scope.Current[prop] < 0) {
            $scope.Current[prop] = 0;
        }
    }

    $scope.eat = function() {
        if ($scope.Current.Provisions > 0
            && $scope.Current.Stamina < $scope.Initial.Stamina) {
            $scope.Current.Stamina += 4;
            $scope.changeVal("Stamina");
            $scope.Current.Provisions -= 1;
        }
    }
});