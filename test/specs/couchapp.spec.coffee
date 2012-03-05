define 'specs/couchapp', ['couchapp'], (couchApp) ->
  
  describe "couchApp", ->
    
    describe "new", ->
      it "should store the couchDB URL", ->
        app = new couchApp 'http://example.com'
        expect(app.couchDB_url).toBe 'http://example.com'
        
      it "should remove trailing slash from passed URL", ->
        app = new couchApp 'http://example.com/'
        expect(app.couchDB_url).toBe 'http://example.com'
      
    # /new
  # /couchApp