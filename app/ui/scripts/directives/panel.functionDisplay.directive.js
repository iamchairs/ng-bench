(function() {
  'use strict';

  angular.module('panel').directive('functionDisplay', functionDisplay);

  function functionDisplay() {
    return {
      compile: compile,
      templateUrl: 'ui/templates/panel.functionDisplay.template.html',
      scope: {
        functionDisplay: '='
      }
    };

    function compile () {
      return link;
    }

    function link ($scope, ele) {
      var functionHeadRegex = /function\s*([^\s*]*)\s*\(/;
      $scope.name = $scope.functionDisplay.match(functionHeadRegex)[1];

      $scope.expanded = false;
      $scope.expand = expand;
      $scope.contract = contract;
      
      $scope.isAnonymous = !$scope.name;
      if($scope.isAnonymous) {
        $scope.name = 'anonymous';
      }

      function expand() {
        $scope.expanded = true;
      }

      function contract() {
        $scope.expanded = false;
      }
    }
  }

})();