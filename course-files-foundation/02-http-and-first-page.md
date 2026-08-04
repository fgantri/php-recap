# 02 — HTTP, Servers, and Your First Dynamic Page

The goal of this chapter is small: get something to appear in a browser. Getting there requires understanding what a browser actually is and what it is talking to.

## Start with static HTML

Inside your `demo` directory, create a file called `index.html`. Most editors will expand a snippet into HTML boilerplate for you; if not, write it by hand:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Demo</title>
</head>
<body>
    <h1>Hello World</h1>
</body>
</html>
```

This file is *static*: the bytes on disk are exactly the bytes the browser receives. Every visitor gets the same thing.

---

> **Foundation — What actually happens when you load a page**
>
> The browser is a **client**. Somewhere there is a **server** — a program that is running, listening, and waiting to be spoken to. The conversation between them follows a protocol called **HTTP**, and HTTP is startlingly simple: it is text.
>
> The client sends a **request**, which looks roughly like this:
>
> ```
> GET /index.html HTTP/1.1
> Host: localhost:8888
> User-Agent: Mozilla/5.0 ...
> ```
>
> A method (`GET`), a path (`/index.html`), a protocol version, then a set of headers. The server sends back a **response**:
>
> ```
> HTTP/1.1 200 OK
> Content-Type: text/html
> Content-Length: 137
>
> <!DOCTYPE html> ...
> ```
>
> A status code (`200 OK`), headers, a blank line, then the body. The browser takes that body and renders it.
>
> Two consequences worth internalising now. First, HTTP is **stateless**: each request stands alone, and the server remembers nothing about the last one unless you build a mechanism for it (cookies and sessions — later in your learning). Second, everything you will ever build is a program that turns a request into a response. That is the entire job.

> **Foundation — Hosts, ports, and `localhost`**
>
> A machine on a network is found by its **IP address** — `93.184.216.34`, or on the modern scheme something much longer. Humans use **domain names** instead (`example.com`), and DNS translates one into the other before the request is sent.
>
> One machine can run many server programs at once, so an address alone is not enough. A **port** is a number from 0 to 65535 that identifies *which* listening program on that machine you want. Web traffic defaults to port 80 for HTTP and 443 for HTTPS, which is why you never type them.
>
> `localhost` is a name that always resolves to `127.0.0.1`, the loopback address — "this same machine". A request to `localhost` never touches the network card. When you run a development server, your browser and your server are the same computer talking to itself.
>
> So `http://localhost:8888` means: speak HTTP, to this machine, to whichever program has claimed port 8888.

---

## Booting a server

If you installed a bundled stack, Apache or Nginx is already running and its documentation tells you the URL. Otherwise you need to start something yourself, and PHP ships with a server built in.

Ask PHP what it can do:

```bash
php -h
```

Among the flags is `-S`, described as running with a built-in web server. That is what we want:

```bash
php -S localhost:8888
```

The terminal now blocks — the process is alive and listening. Open `http://localhost:8888` and your HTML appears.

> **Foundation — What "the server is running" means**
>
> `php -S` starts a long-lived process that opens a socket on port 8888 and waits. Every browser request wakes it, gets handled, and gets answered. The process stays alive between requests.
>
> Because it occupies your terminal, that terminal is now busy. Open a second terminal tab for other commands. `Ctrl+C` stops the server.
>
> This built-in server is a development convenience, single-purpose and deliberately simple. It is not built for production traffic — that is Apache's or Nginx's job. But for learning it removes an entire category of configuration problems, and it behaves close enough to the real thing.

## The `index` convention

Notice that `http://localhost:8888` worked without you typing `/index.html`. That is not magic and it is not PHP-specific.

When a request arrives for a *directory* rather than a specific file, web servers look for a default file inside it. That default is almost universally `index.html` or `index.php`. Rename your file to anything else and refresh: the server can no longer find a default, and the page breaks.

Remember this. `index` is one of the most load-bearing filenames in web development, and it will come back in Chapter 09 when you build a router around exactly this behaviour.

---

## Switching to PHP

Rename the file to `index.php`.

Refresh. It still works, unchanged. That is worth pausing on: **a PHP file containing no PHP is just an HTML file.** PHP does not require you to opt into it everywhere. It passes through anything it does not recognise as code, verbatim.

What you have gained is the ability to open a **PHP block** anywhere in that file.

## PHP tags

```php
<?php  ?>
```

Less-than, question mark, the letters `php`, then your code, then question mark, greater-than.

It is genuinely awkward to type the first several dozen times. You will look at the keyboard. That stops eventually, and there is no shortcut through it other than repetition.

Everything *inside* those tags is treated as PHP source. Everything outside them is output as-is.

Try the naive thing first:

```php
<h1><?php hello world ?></h1>
```

A good editor complains immediately. The browser shows a **parse error**.

> **Foundation — Parse errors vs. runtime errors**
>
> Before PHP executes anything, it *parses* the whole file: it reads the text and checks that it forms valid grammar in the language. `hello world` is not a valid statement, so parsing fails and nothing runs at all — not even the correct lines above it.
>
> This is why a single typo can blank an entire page. It also explains a useful diagnostic: if a change you made produces a *completely* empty or error page rather than a partially rendered one, suspect a syntax error rather than a logic error.
>
> Runtime errors are different — the file parses fine, execution starts, and something goes wrong partway through. Those produce output up to the point of failure. You will see both, and telling them apart from the shape of the broken page is a real skill.

## `echo` — putting text on the page

```php
<h1><?php echo 'hello world'; ?></h1>
```

Three pieces, each of which matters:

**`echo`** is the instruction to output something. Think of it as *print this onto the page*. PHP also has `print`, which is nearly identical; `echo` is what almost everyone uses, so use it.

**`'hello world'`** is a **string**.

> **Foundation — What a string is**
>
> A string is literal text — a sequence of characters that mean exactly what they say. The quotes are how you tell PHP "the following characters are data, not instructions."
>
> Without quotes, `hello` would be an identifier: PHP would go looking for something *named* hello and fail. With quotes, it is five characters and nothing more.
>
> This distinction between *code* and *data* is one of the most important in programming, and quotes are where you first meet it. It returns with real consequences in Chapter 12, where the difference between treating user input as data and accidentally treating it as code is the difference between a working site and a destroyed database.

**`;`** ends the statement. Think of it as the full stop of a sentence: *I am finished with this instruction.* Almost every PHP statement needs one, and a missing semicolon is one of the two or three most common parse errors you will ever produce.

Refresh. You get exactly what the static version showed — but now it came from code.

---

## Practise the awkward part

Before moving on, spend a few minutes doing nothing but this:

```php
<h1><?php echo 'hello universe'; ?></h1>
<p><?php echo 'some gibberish'; ?></p>
<p><?php echo 'hello town'; ?></p>
```

Put PHP blocks in different places in the document. Echo different strings. The entire point is to stop having to think about `<?php ... ?>`.

## What you legitimately know now

- PHP code can be mixed into any HTML document, and it will be executed while the surrounding HTML passes through untouched. This mixing is somewhat unusual among languages, and it is a large part of why PHP spread the way it did.
- `echo` outputs a string; strings go in quotes; quotes can be single or double, and the difference between them is real and covered in the next chapter.
- Statements end in `;`.
- A server is a process listening on a port; `index` is the default filename; a parse error stops everything.

And a fair objection: *what was gained?* Echoing a hardcoded string is strictly worse than typing that string as HTML. Correct. Right now you are shaking hands with the language. The payoff starts in the next chapter, the moment the text stops being something you know in advance.

**Next:** [03 — Strings, variables and types](03-strings-variables-types.md)
