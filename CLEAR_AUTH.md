# Clear Authentication for Testing

Open browser console (F12) and run:

```javascript
localStorage.clear()
location.reload()
```

Or just:
```javascript
localStorage.removeItem('token')
location.reload()
```

This will log you out and reload the page.
Then click feature buttons to test the login modal.
