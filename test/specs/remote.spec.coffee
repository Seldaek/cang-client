define 'specs/remote', ['mocks/couchapp'], (couchAppMock) ->
  
  describe "Remote", ->  
    beforeEach ->
      @app = new couchAppMock 
      @store = new Store @app
  # /Remote