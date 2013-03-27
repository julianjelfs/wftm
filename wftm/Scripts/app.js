var app = angular.module("App", ["LocalStorageModule"]);

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

app.controller("WarlockCtrl", function($scope, localStorageService, dice) {
    if (localStorageService.isSupported()) {
        var data = localStorageService.get("wftmdata");
        if (data != null) {
            data = JSON.parse(data);
            $scope.Initial = data.Initial;
            $scope.Current = data.Current;
            $scope.Monsters = data.Monsters;
            $scope.Possessions = data.Possessions;sdfsdfsdfds
        } else {
            initialise();
        }
    } else {
        initialise();
    }

    $scope.supportSave = function(){
        return localStorageService.isSupported();
    }

    $scope.testLuck = function(){
        if($scope.Current.Luck <= 0)
            return;

        $scope.lucky();
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
            Provisions: 10
        };    
        $scope.Monsters = [];
        $scope.Possessions = [];
        $scope.Current = angular.copy($scope.Initial);
        $scope.luckyOrNot = {backgroundColor : 'none'};
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