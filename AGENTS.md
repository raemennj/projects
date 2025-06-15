# Instructions for the Assistant

This repository hosts a GitHub Pages site. All future HTML projects should include a hamburger menu that links back to `/index.html`.

- The menu is implemented in **hamburger_menu.html** located at the repository root.
- To include the menu in a page, embed the following snippet near the top of the `<body>` tag:

```html
<iframe src="/hamburger_menu.html" style="border:none;width:60px;height:60px;position:fixed;top:10px;left:10px;z-index:1000;"></iframe>
```

Ensure this snippet appears in new HTML pages so users can always navigate back to the index page.
