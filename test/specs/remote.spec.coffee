define 'specs/remote', ['store', 'couchapp'], (Store, couchApp) ->
  
  class app_mock
    uuid    : -> 'abc',
    trigger : ->
  
  describe "Remote", ->  
    beforeEach ->
      @app = new app_mock 
      @store = new Store @app
  # /Remote