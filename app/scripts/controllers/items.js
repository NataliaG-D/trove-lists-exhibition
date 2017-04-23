'use strict';

/**
 * @ngdoc function
 * @name trovelistsApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the trovelistsApp
 */
angular.module('trovelistsApp')
  .controller('ItemsCtrl', ['$scope', '$rootScope', '$routeParams', '$document', '$filter', '$http', '$q', '$location', 'ListsDataFactory', function ($scope, $rootScope, $routeParams, $document, $filter, $http, $q, $location, ListsDataFactory) {
    $document.scrollTop(0);
    $scope.view = 'list';
    $scope.totalDisplayed = 20;
    $scope.loadMore = function() {
      if ($scope.totalDisplayed < $scope.items.length) {
        $scope.totalDisplayed += 20;
      }
    };
    $scope.displayTertiary = function(item){
      event.preventDefault();
      setItem(item);
      $('.popup-highlights').addClass('is-visible');
      if (item.thumbnail!=undefined){
        $('#itemimagesrc').attr('src',item.thumbnail);
        if(!$('#firstitemslide').hasClass('highSlides')) {
          $('#firstitemslide').addClass('highSlides');
        }
      }else{
        if($('#firstitemslide').hasClass('highSlides')) {
          $('#firstitemslide').removeClass('highSlides');
        }
        $('#firstitemslide').css('display','none');

      }
      $('.itemtitle').html(item.title);
      $('.itemdate').html(item.date);
      $('.itemtype').html(item.type);
      if (item.newspaper!=undefined){
        $('.itemcaption').html("<p><em>"+item.newspaper+"</em>, page "+item.page+"</p>");
      }else{
        $('.itemcaption').html("");
      }
      showSlides(1);
    };
    var setItem = function(item) {
      //var item = $filter('findById')($rootScope.items, $routeParams.order);
      $scope.item = item;
      if (item.type === 'newspaper') {
        $http.jsonp('http://api.trove.nla.gov.au/newspaper/' + item.id + '?encoding=json&reclevel=full&include=articletext&key=' + window.troveAPIKey + '&callback=JSON_CALLBACK', {cache: true})
          .then(function successCallback(response) {
            //var paras = response.data.article.articleText.match(/<p>.*?<\/p>/g);
            //$scope.articleText = paras.slice(0,5).join('') + '&hellip;';
            $scope.articleText = response.data.article.articleText;
            $scope.words = response.data.article.wordCount;
            $scope.showText('snippet');
        });
      } else if (item.type === 'work' && item.holdings === 1) {
        $http.jsonp('http://api.trove.nla.gov.au/work/' + item.id + '?encoding=json&reclevel=full&include=holdings&key=' + window.troveAPIKey + '&callback=JSON_CALLBACK', {cache: true})
          .then(function successCallback(response) {
            var nuc;
            try {
              nuc = response.data.work.holding[0].nuc;
            } catch(e) {
              //Do nothing
            }
            if (typeof nuc !== 'undefined') {
              $http.jsonp('http://api.trove.nla.gov.au/contributor/' + nuc + '?encoding=json&key=' + window.troveAPIKey + '&callback=JSON_CALLBACK', {cache: true})
                .then(function successCallback(response) {
                  $scope.repository = response.data.contributor.name.replace(/\.$/, '');
              });
            }
        });
      }
    };
    $scope.showText = function(length) {
      if (length === 'snippet') {
        $scope.displayText = $filter('words')($scope.articleText, 100);
        $scope.fullText = false;
      } else {
        $scope.displayText = $scope.articleText;
        $scope.fullText = true;
      }
      $('.itemdisplaytext').html($scope.displayText);
    };
    if (typeof $rootScope.items === 'undefined' && $rootScope.failed !== true) {
        var tries = 1;
        var loadListData = function() {
          var promises = ListsDataFactory.getPromises();
          $q.all(promises).then(
          function successCallback(responses) {
            ListsDataFactory.loadResources(responses);
          },
          function errorCallback() {
            if (tries < 1) {
              tries++;
              loadListData();
            } else {
              //$rootScope.listHide = false;
              $rootScope.failed = true;
            }
          });
        };
        loadListData();
    } else if ($rootScope.failed === true) {
      $location.url('/');
    }
  }]);
