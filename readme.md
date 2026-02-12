# 💘 Be My Valentine?

A very simple, slightly cringe, completely rigged Valentine's Day website.

## What it does

Asks someone to be your Valentine. The **Yes** button is big, pink, and satisfying to press. The **No** button runs away when you hover over it, shrinks, and eventually disappears entirely. There is no way to say no. This is by design.

## File structure

```
├── index.html   # markup
├── style.css    # styles & animations
├── script.js    # button logic (the no button escaping, the yes ripple)
└── README.md    # you are here
```

## How to use

Just open `index.html` in a browser — no build tools, no dependencies, no npm install. It's a webpage.

If you want to put it online, any static host works:

- **GitHub Pages** — push to a repo, enable Pages in settings, done
- **Netlify** — drag and drop the folder onto [netlify.com/drop](https://netlify.com/drop)
- **Vercel** — `vercel deploy` from the folder

## Customisation

All the text lives in `index.html`. Change the message, the button labels, or the yes-screen response to whatever fits.

Colours are set in `style.css` — the main pink is `#ff2d78` if you want to swap it out.

## Tech

Plain HTML, CSS, and vanilla JS. No frameworks. No bundler. Fonts from Google Fonts (Pacifico + Comic Neue, obviously).

---

*Good luck. The no button doesn't work anyway.*