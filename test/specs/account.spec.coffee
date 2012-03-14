define 'specs/account', ['mocks/couchapp', 'account'], (couchAppMock, Account) ->
  
  describe "Account", ->
    beforeEach ->
      @app = new couchAppMock
      @account = new Account @app
    
      # requests
      spyOn(@app, "request")
      spyOn(@app, "trigger")
  
    describe "new", ->
      beforeEach ->
        spyOn(Account.prototype, "authenticate")
        spyOn(@app, "on")
      
      _when "_couch.account.email is set", ->
        beforeEach ->
          spyOn(@app.store.db, "getItem").andCallFake (key) ->
            if key is '_couch.account.email'
              return 'joe@example.com'
              
          it "should set @email", ->
            account = new Account @app
            expect(account.email).toBe 'joe@example.com'          
            
      it "should authenticate", ->
        account = new Account @app
        expect(account.authenticate).wasCalled()
        
      it "should bind to sign_in event", ->
        account = new Account @app
        expect(@app.on).wasCalledWith 'account:sign_in', account._handle_sign_in
      
      it "should bind to sign_out event", ->
        account = new Account @app
        expect(@app.on).wasCalledWith 'account:sign_out', account._handle_sign_out
    # /new
    
    describe "event handlers", ->
      describe "_handle_sign_in", ->
        beforeEach ->
          spyOn(@app.store.db, "setItem")
          @account._handle_sign_in {"ok":true,"name":"joe@example.com","roles":[]}
        
        it "should set @email", ->
          expect(@account.email).toBe 'joe@example.com'
          
        it "should store @email persistantly", ->
          expect(@app.store.db.setItem).wasCalledWith '_couch.account.email', 'joe@example.com'
          
        it "should set _authenticated to true", ->
          @account._authenticated = false
          @account._handle_sign_in {"ok":true,"name":"joe@example.com","roles":[]}
          expect(@account._authenticated).toBe true
      # /_handle_sign_in
      
      describe "_handle_sign_out", ->
        it "should set @email", ->
          @account.email = 'joe@example.com'
          @account._handle_sign_out {"ok":true}
          do expect(@account.email).toBeUndefined
          
        it "should store @email persistantly", ->
          spyOn(@app.store.db, "removeItem")
          @account._handle_sign_out {"ok":true}
          expect(@app.store.db.removeItem).wasCalledWith '_couch.account.email'
          
        it "should set _authenticated to false", ->
          @account._authenticated = true
          @account._handle_sign_out {"ok":true}
          expect(@account._authenticated).toBe false
      # /_handle_sign_out
    # /event handlers
    
    describe ".authenticate()", ->
      
    # /.authenticate()
  
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