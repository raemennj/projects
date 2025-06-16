# Instructions for the Assistant

This repository hosts a GitHub Pages site. All future HTML projects should include a hamburger menu that links back to `/index.html`.

## Embedding the menu

GitHub Pages sets `X-Frame-Options: DENY`, so pages hosted here cannot be loaded in iframes. Instead of using an iframe, copy the menu markup and styles from **hamburger_menu.html** directly into each page.

Paste the following snippet just after the opening `<body>` tag:

```html
<style>
    body { margin: 0; font-family: Arial, sans-serif; }
    #menuToggle {
        display: block;
        position: fixed;
        top: 20px;
        left: 20px;
        z-index: 1000;
    }
    #menuToggle input { display: none; }
    #menuToggle span {
        display: block;
        width: 33px;
        height: 4px;
        margin-bottom: 5px;
        background: #333;
        border-radius: 3px;
        transition: all 0.3s ease-in-out;
    }
    #menu {
        position: fixed;
        left: -200px;
        top: 0;
        width: 200px;
        height: 100%;
        background: #f8f9fa;
        box-shadow: 0 0 10px rgba(0,0,0,0.3);
        transition: left 0.3s ease-in-out;
        padding-top: 60px;
    }
    #menu a {
        display: block;
        padding: 10px 20px;
        text-decoration: none;
        color: #333;
    }
    #menuToggle input:checked ~ #menu { left: 0; }
</style>
<nav id="menuToggle">
    <input type="checkbox" />
    <span></span>
    <span></span>
    <span></span>
    <div id="menu">
        <a href="/index.html">Home</a>
    </div>
</nav>
```

Ensure this snippet appears in new HTML pages so users can always navigate back to the index page.
