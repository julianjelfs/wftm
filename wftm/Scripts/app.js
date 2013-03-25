var app = angular.module("App", ["LocalStorageModule"]);

app.controller("WarlockCtrl", function($scope, $window, localStorageService) {
    if (localStorageService.isSupported()) {
        var data = localStorageService.get("wftmdata");
        if (data != null) {
            data = JSON.parse(data);
            $scope.Initial = data.Initial;
            $scope.Current = data.Current;
            $scope.Monsters = data.Monsters;
            $scope.Possessions = data.Possessions;
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
            roll1 : rollDice(),
            roll2 : rollDice()
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
            Stamina: rollDice() + rollDice() + 12,
            Skill: rollDice() + 6,
            Luck: rollDice() + 6,
            Provisions: 10
        };    
        $scope.Monsters = [];
        $scope.Possessions = [];
        $scope.Current = angular.copy($scope.Initial);
        $scope.luckyOrNot = {backgroundColor : 'none'};
    }

    $scope.addMonster = function() {
        $scope.Monsters.push({
            Skill: 10,
            Stamina: 12,
            Name: '',
            Dead: false,
            Luck : false,
            Status : ''
        });
    }

    $scope.addPossession = function(possession){
        if($scope.newPossession == null)
            return;
        $scope.Possessions.push(possession);
        $scope.newPossession = null;
    }

    $scope.deletePossession = function(possession){
        var index = $scope.Possessions.indexOf(possession);
        if(index >= 0){
            $scope.Possessions.splice(index, 1);
        }
    }

    $scope.toggleLuck = function(monster) {
        if($scope.Current.Luck <= 0)
            return;
        monster.Luck = !monster.Luck;
    }

    $scope.usingLuckClass = function(monster) {
        if($scope.Current.Luck <= 0)
            monster.Luck = false;
        return monster.Luck ? "btn btn-danger" : "btn";
    }

    $scope.diceClass = function(num) {
        return "dice dice" + num;
    }

    $scope.fightMonster = function(monster) {
        if (monster.Dead)
            return;

        monster.Round = {
            you: {
                roll1: rollDice(),
                roll2: rollDice()
            },
            monster: {
                roll1: rollDice(),
                roll2: rollDice()
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
                monster.Round.TestLuck = function(){
                    if($scope.lucky()){
                        $scope.Current.Stamina += 1;
                        monster.Status = "You were lucky!";
                    } else {
                        monster.Status = "You were not lucky this time";
                    }
                    monster.Round.Complete = true;
                }
            }

            if ($scope.Current.Stamina <= 0) {
                monster.Status = "Gah - you've been killed";
            } else {
                monster.Status = 'Boo the monster wounded you!';
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

    function rollDice() {
        var min = 1;
        var max = 6;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
});