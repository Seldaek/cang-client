define 'specs/remote', ['mocks/cang'], (CangMock) ->
  
  describe "Remote", ->  
    beforeEach ->
      @app = new CangMock 
      @store = new Store @app
  # /Remote