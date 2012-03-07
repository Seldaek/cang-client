define 'specs/account', ['account'], (Account) ->
  
  class app_mock
    couchDB_url : 'http://my.cou.ch'
    trigger     : ->
    request     : ->
    on          : ->
    store       :
      db :
        getItem    : ->
        setItem    : ->
        removeItem : ->
          
  describe "couchApp", ->
    beforeEach ->
      @app = new app_mock
      @account = new Account @app
    
      # requests
      spyOn(@app, "request")
      spyOn(@app, "trigger")
  
    describe ".sign_up(email, password)", ->
      beforeEach ->
        @account.sign_up('joe@example.com', 'secret')
        [@type, @path, @options] = @app.request.mostRecentCall.args
    
      it "should send a PUT request to http://my.cou.ch/_users/org.couchdb.user%3Ajoe%40example.com", ->
        expect(@app.request).wasCalled()
        expect(@type).toBe 'PUT'
        expect(@path).toBe  '/_users/org.couchdb.user%3Ajoe%40example.com'
    
      it "should have set _id to 'org.couchdb.user:joe@example.com'", ->
        expect(@options.data._id).toBe 'org.couchdb.user:joe@example.com'
      
      it "should have set name to 'joe@example.com", ->
        expect(@options.data.name).toBe 'joe@example.com'
        
      it "should have set type to 'user", ->
        expect(@options.data.type).toBe 'user'

      it "should pass password", ->
        expect(@options.data.password).toBe 'secret'
        
      _when "sign_up successful", ->
        beforeEach ->
          @app.request.andCallFake (type, path, options) -> options.success()
        
        it "should trigger `account:sign_up` event", ->
          @account.sign_up('joe@example.com', 'secret')
          expect(@app.trigger).wasCalledWith 'account:sign_up'
          
        it "should trigger `account:sign_in` event", ->
          @account.sign_up('joe@example.com', 'secret')
          expect(@app.trigger).wasCalledWith 'account:sign_in'
    # /.sign_up(email, password)
  
    describe ".sign_in(email, password)", ->
      beforeEach ->
        @account.sign_in('joe@example.com', 'secret')
        [@type, @path, @options] = @app.request.mostRecentCall.args
    
      it "should send a POST request to http://my.cou.ch/_session", ->
        expect(@app.request).wasCalled()
        expect(@type).toBe 'POST'
        expect(@path).toBe  '/_session'
      
      it "should send email as name parameter", ->
        expect(@options.data.name).toBe 'joe@example.com'
    
      it "should send password", ->
        expect(@options.data.password).toBe 'secret'
        
      _when "sign_up successful", ->
        beforeEach ->
          @app.request.andCallFake (type, path, options) -> options.success()
          
        it "should trigger `account:sign_in` event", ->
          @account.sign_in('joe@example.com', 'secret')
          expect(@app.trigger).wasCalledWith 'account:sign_in'
    # /.sign_in(email, password)
  
    describe ".change_password(email, password)", ->
      it "should have some specs"
    # /.change_password(email, password)
  
    describe ".sign_out()", ->
      beforeEach ->
        @account.sign_out()
        [@type, @path, @options] = @app.request.mostRecentCall.args
    
      it "should send a DELETE request to http://my.cou.ch/_session", ->
        expect(@app.request).wasCalled()
        expect(@type).toBe 'DELETE'
        expect(@path).toBe  '/_session'
        
      _when "sign_up successful", ->
        beforeEach ->
          @app.request.andCallFake (type, path, options) -> options.success()
          
        it "should trigger `account:sign_out` event", ->
          @account.sign_out('joe@example.com', 'secret')
          expect(@app.trigger).wasCalledWith 'account:sign_out'
    # /.sign_in(email, password)
  # /couchApp