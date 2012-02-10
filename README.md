Let there be couchCapp: and there was couchCapp.

API
===

(to be implemented)


Setup
-----

```javascript
couchDB_endpoint = 'worlddominatorapp.iriscouch.com'
app = new couchApp(couchDB_endpoint)
```


Accounts / Sessions
-------------------


### Sign Up

```javascript
app.sign_up('joe@example.com', 'secret')

  .success( function(user) {
    user.email // 'joe@example.com'
    user.uuid  // auto generated
    
    // data sync kicks in
  } ) 
  
  // signup error
  .error( function(err) {
    alert("Oops: " + err.message)
  } ) 
```


### Sign In

```javascript
app.sign_in('joe@example.com', 'secret')

  .success( function(user) {
    // data sync kicks in
  } ) 
  .error( function(err) {
    alert("Oops: " + err.message)
  } ) 
```


### Sign Out

```javascript
app.sign_out()

  .success( function() {
    // session ends, local data gets cleaned up
  } ) 
  .error( function(err) {
    alert("Oops: " + err.message)
  } ) 
```


### Forgot Password

```javascript
app.forgot_password('joe@example.com')

  .success( function() {
    alert( "Link has been sent to joe@example.com")
  } ) 
  .error( function(err) {
    alert("Oops: " + err.message)
  } )
```


Data Storage / Sync
-------------------


### uuid

helper to generate unique IDs that you can use to store your objects.

```javascript
uuid = app.uuid()
```


### Create

create a new object.

```javascript
uuid = app.uuid()
type = 'rule'
app.save( uuid, type, {name: "rule the world"} )
  
  .success ( function(new_object) { } )
  .error   ( function(err)        { } )
```


### Update

update an existing object.

```javascript
app.save( known_id, {name: "rule the world like a baws."} )

  .success ( function(updated_object) { } )
  .error   ( function(err)            { } )
```


### Get

load an existing object

```javascript
app.get( known_id )

  .success ( function(object) { } )
  .error   ( function(err)    { } )
```


### Get All

load all objects available or from a specific type

```javascript
app.getAll( type )

  .success ( function(objects) { } )
  .error   ( function(err)     { } )
```


### Delete

delete an existing object

```javascript
app.destroy( known_id )

  .success ( function(deleted_object) { } )
  .error   ( function(err)            { } )
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

app.send_email( known_id )
  
  // successfully synched to server
  .outbox  ( function(email) { } )
  
  // email sent successfully
  .sent    ( function(email) { } )
  
  // something went wrong
  .error   ( function(err)   { } )
```


Future Ideas
------------

* sharing
* searching
* payments
* ... ?