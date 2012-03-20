define 'specs/remote', ['mocks/kang'], (KangMock) ->

  describe "Remote", ->
    beforeEach ->
      @app = new KangMock
      @store = new Store @app
  # /Remote