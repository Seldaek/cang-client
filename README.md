API
===


Setup
-----

```javascript
Cang = require('cang')
couchDB_endpoint = 'http://worlddominatorapp.iriscouch.com';
app = new Cang(couchDB_endpoint);
```


Accounts / Sessions
-------------------


### Sign Up

```javascript
app.account.sign_up('joe@example.com', 'secret')

  .done( function(user) {
    user.email // 'joe@example.com'
    user.uuid  // auto generated
    
    // data sync kicks in
  } ) 
  
  // signup error
  .fail( function(err) {
    alert("Oops: " + err.message)
  } ) 
```


### Sign In

```javascript
app.account.sign_in('joe@example.com', 'secret')

  .done( function(user) {
    // data sync kicks in
  } ) 
  .fail( function(err) {
    alert("Oops: " + err.message)
  } ) 
```

### Change password

```javascript
app.account.change_password('current_secret', 'new_secret')

  .done( function(user) { } ) 
  .fail( function(err)  { } )
```

### Sign Out

```javascript
app.account.sign_out()

  .done( function() {
    // session ends, local data gets cleaned up
  } ) 
  .fail( function(err) {
    alert("Oops: " + err.message)
  } ) 
```


### Forgot Password

```javascript
app.account.forgot_password('joe@example.com')

  .done( function() {
    alert( "Link has been sent to joe@example.com")
  } ) 
  .fail( function(err) {
    alert("Oops: " + err.message)
  } )
```


Data Storage / Sync
-------------------

### uuid

helper to generate unique IDs that you can use to store your objects.

```javascript
uuid = app.store.uuid(length)
```


### Create / Update

create or update an object.

```javascript
// create a new object
type = 'rule'
app.store.save( type, {name: "rule the world"} )
  
  .done ( function(new_object) { } )
  .fail ( function(err)        { } )
  
// update an existing object
id   = 'abc4567'
type = 'rule'
app.store.save( type, id, {name: "rule the world"} )
  
  .done ( function(new_object) { } )
  .fail ( function(err)        { } )
  
// alternative syntax
app.store.save( {name: "rule the world", type: "rule", id: "abc4567"} )
  
  .done ( function(new_object) { } )
  .fail ( function(err)        { } )
```


### Load

load an existing object

```javascript
app.store.load( type, id )

  .done ( function(object) { } )
  .fail ( function(err)    { } )
```


### Load all

load all objects available or from a specific type

```javascript
app.store.loadAll( type )

  .done ( function(objects) { } )
  .fail ( function(err)     { } )
```


### Delete

delete an existing object

```javascript
app.store.delete( type, id )

  .done ( function(deleted_object) { } )
  .fail ( function(err)            { } )
```


### Remote Updates

subscribe to changes from remote

```javascript
// new doc created
app.remote.on_create( function( created_object) { } )

// existing doc updated
app.remote.on_update( function( update_object)  { } )

// doc deleted
app.remote.on_delete( function( deleted_object) { } )

// any of above events
app.remote.on_change( function( changed_object) { } )

// all listeners can be filtered by type
app.remote.on_create( type, function( created_object) { } )
app.remote.on_update( type, function( update_object)  { } )
app.remote.on_delete( type, function( deleted_object) { } )
app.remote.on_change( type, function( changed_object) { } )
```


Send E-Mails
------------

hell, yeah!

```javascript
email = {
  from    : 'joe@example.com',
  to      : ['you@roundthewor.ld'],
  cc      : ['Rest of the World <rest@roundthewor.ld>'],
  subject : 'rule the wolrd',
  body    : "we can do it!\nSigned, Joe"
}

app.email.send( email )
  
  // successfully synched to server
  .progress ( function(email) { } )
  
  // email sent successfully
  .done     ( function(email) { } )
  
  // something went wrong
  .fail     ( function(err)   { } )
```


Future Ideas
------------

* sharing
* searching
* payments
* ... ?


Dependencies
------------

Cang depends on jQuery/[zepto](http://zeptojs.com/) and [require.js](http://requirejs.org) 


Contribute
==========

When you feel like contributing, I highly recommend to install [PhantomJS](http://www.phantomjs.org/) for automated, headless testing. Run `$ cake autotest` to have test running in the background while hacking.

When you're done with changes, make sure to run `$ r.js -o name=cang baseUrl=./compiled out=cang.min.js` to update the concatenated & minified js file for production use.