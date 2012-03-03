define 'specs/couchapp', ['couchapp'], (couchApp) ->
  
  describe "couchApp", ->
    beforeEach ->
      @app = new couchApp 'http://my.cou.ch'
    
      # requests
      spyOn($, "ajax").andReturn $.Deferred()
    
      # store
      spyOn(@app.store, "_getItem").andCallThrough()
      spyOn(@app.store, "_setItem").andCallThrough()
      spyOn(@app.store, "_removeItem").andCallThrough()
      spyOn(@app.store, "_clear").andCallThrough()
      @app.store.clear()
  
    describe ".sign_up(email, password)", ->
      beforeEach ->
        @app.sign_up('joe@example.com', 'secret')
        @args = $.ajax.mostRecentCall.args[0]
        @data = JSON.parse @args.data
    
      it "should send a PUT request to http://my.cou.ch/_users/org.couchdb.user%3Ajoe%40example.com", ->
        expect($.ajax).wasCalled()
        expect(@args.type).toBe 'PUT'
        expect(@args.url).toBe  'http://my.cou.ch/_users/org.couchdb.user%3Ajoe%40example.com'
      
      it "should set Content-Type to application/json", ->
        expect(@args.contentType).toBe 'application/json'
    
      it "should have set _id to 'org.couchdb.user:joe@example.com'", ->
        expect(@data._id).toBe 'org.couchdb.user:joe@example.com'
      
      it "should have set name to 'joe@example.com", ->
        expect(@data.name).toBe 'joe@example.com'
        
      it "should have set type to 'user", ->
        expect(@data.type).toBe 'user'

      it "should pass password", ->
        expect(@data.password).toBe 'secret'
    # /.sign_up(email, password)
  
    describe ".sign_in(email, password)", ->
      beforeEach ->
        @app.sign_in('joe@example.com', 'secret')
        @args = $.ajax.mostRecentCall.args[0]
        @data = JSON.parse @args.data
    
      it "should send a POST request to http://my.cou.ch/_session", ->
        expect($.ajax).wasCalled()
        expect(@args.type).toBe 'POST'
        expect(@args.url).toBe  'http://my.cou.ch/_session'
      
      it "should send email as name parameter", ->
        expect(@data.name).toBe 'joe@example.com'
    
      it "should send password", ->
        expect(@data.password).toBe 'secret'
    # /.sign_in(email, password)
  
    describe ".change_password(email, password)", ->
      it "should have some specs"
    # /.sign_up(email, password)
  
    describe ".sign_out()", ->
      beforeEach ->
        @app.sign_out()
        @args = $.ajax.mostRecentCall.args[0]
    
      it "should send a DELETE request to http://my.cou.ch/_session", ->
        expect($.ajax).wasCalled()
        expect(@args.type).toBe 'DELETE'
        expect(@args.url).toBe  'http://my.cou.ch/_session'
    # /.sign_in(email, password)
  # /couchApp