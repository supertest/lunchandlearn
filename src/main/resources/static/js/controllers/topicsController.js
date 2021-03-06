angular.module('controllers').controller('topicsController', [
	'$scope', '$uibModal', 'topicService', 'pagingService',
	function($scope, $uibModal, topicService, pagingService) {
		var self = this;

		self.pageSizes = pagingService.pageSizes;
		self.currentPage = 1;
		self.currentPageSize = pagingService.currentPageSize;
		self.maxPages = pagingService.maxPageSize;

		self.checkSearch = function($event) {
			if($event.which === 13 || $event.keyCode === 13) {
				self.list();
			}
		};

		self.savePageSize = function() {
			pagingService.savePageSize(self.currentPageSize);
		};

		self.setListResult = function(data) {
			self.totalPages = data.totalPages;
			self.totalCount = data.totalElements;
			self.searchedTopics = {totalCount: self.totalCount, data: data.content};
			self.fromCount = (data.size * data.number) + 1;
			self.toCount = (self.fromCount - 1) + data.numberOfElements;
		};

		self.list = function() {
			topicService.listTopics(pagingService.getConfigObj(self)).then(function(response) {
				if(angular.isDefined(response.data)) {
					self.setListResult(response.data);
				}
			});
		}

		self.showEdit = function(guid) {
			topicService.getTopic(guid).then(function(response) {
				self.topic = response.data;
				self.topic.managers = _.keys(self.topic.managers);
				self.mode = 'edit';
				self.showModalDlg();
			});
		}

		self.save = function() {
			self.topic.managers = topicService.getManagersGuidWithName(self.managers, self.topic.managers);
			topicService.updateTopic(self.topic).then(function(response) {
				self.mode = null;
				self.list();
			});
		}

		self.add = function() {
			topicService.addTopic(self.topic).then(function(response) {
				self.mode = null;
				self.list();
				$scope.$broadcast('topics.refresh');
				
			});
		}

		$scope.$on('topics.refresh', function () {
			self.list();
		})

		self.showAdd = function() {
			self.topic = {};
			self.mode = 'add';
			self.showModalDlg();
		}

		self.remove = function(guid) {
			var topic = topicService.getTopicByGuid(guid, self.topics);
			self.showConfirmationDlg({msg: 'Topic \'' + topic.name + '\'', guid: guid});
		}

		self.doRemove = function(guid) {
			topicService.removeTopic(guid).then(function (response) {
				self.list();
			}, function (response) {
				console.log('error removeTopic: '+ response)
			});
		}

		self.showConfirmationDlg = function (data) {
			var opts = {
				templateUrl: '/lunchandlearn/html/main/confirmationDlg.html',
				controller: 'modalController as self',
				backdrop: 'static',
				resolve: {
					data: function () {
						return {msg: data.msg, item: {guid: data.guid}};
					}
				}
			}
			$uibModal.open(opts).result.then(function (selectedItem) {
				self.doRemove(data.guid)
			}, function () {
				console.log('confirmation modal cancelled')
			});
		}

		self.showModalDlg = function () {
			var opts = {
				templateUrl: '/lunchandlearn/html/topic/topicCreate.html',
				backdrop: 'static',
				controller: 'modalController as self',
				resolve: {
					data: function () {
						return {item: self.topic, mode: self.mode, options: {managers : self.managers}};
					}
				}
			}
			$uibModal.open(opts).result.then(function (selectedItem) {
				self.topic = selectedItem;
				if(self.mode === 'add') {
					self.add();
				}
				else if(self.mode === 'edit') {
					self.save();
				}
			}, function () {
				console.log('confirmation modal cancelled')
			});
		}

		self.list();
	}]);