# 01 — The Machine, the Shell and the Environment

Before a single line of PHP, you need to know what you are talking to.

## Why the language you pick barely matters

You are learning the fundamentals of programming. Whether that happens through PHP, Ruby, Python or something else changes the punctuation, not the ideas. Variables, conditionals, loops, functions, and the discipline of organising code all transfer intact. The first language costs real effort; the second one costs a fraction of it, because by then you are only learning a new spelling for concepts you already own.

So the choice of PHP here is a vehicle. What you extract from it is portable.

---

> **Foundation — What a program actually is**
>
> A file on disk is a sequence of bytes. It becomes a *program* only when something is willing to execute those bytes. Two arrangements exist:
>
> **Compiled.** A compiler translates your source text into machine code — the raw instruction set your CPU understands — and writes it to a new file. You then run that file directly. C and Rust work this way.
>
> **Interpreted.** Another program, called the interpreter, reads your source text and performs the actions it describes, right now, without producing a standalone executable. PHP works this way. The `php` binary on your machine *is* a compiled program, and its job is to read your `.php` files and act on them.
>
> That is why `.php` files are plain text you can open in any editor, and why changing one takes effect on the next request with no build step. It is also why a PHP file with a syntax mistake can appear to work until the moment execution actually reaches the broken line.

---

## The shell, and why everything starts there

Every instruction in this course begins in a terminal. Not because graphical tools are inferior, but because the terminal is the lowest-friction way to say something exact to the operating system.

> **Foundation — Terminal, shell, command, process**
>
> Four things people blur together:
>
> - **Terminal** — the window. Historically a physical machine with a keyboard and screen wired to a computer. Today, a program that draws text and captures keystrokes. It has no idea what `mkdir` means.
> - **Shell** — the program running *inside* the terminal that reads what you type and does something about it. `bash`, `zsh`, `fish`, PowerShell. The shell is a full programming language with variables, conditionals and loops; you are using its interactive mode.
> - **Command** — a word you type. It is either built into the shell (`cd` must be, and you will see why below) or it is the name of an executable file sitting somewhere on disk (`php`, `mkdir`, `git`).
> - **Process** — a running instance of a program, with its own memory, its own working directory and its own set of environment variables. When you type `php -S ...`, the shell creates a new process, hands it your arguments, and waits.
>
> When you type `php`, the shell does not search your whole disk. It walks through a list of directories held in an environment variable called `PATH`, in order, and runs the first executable named `php` that it finds. This is why an installation that "didn't work" is nearly always a `PATH` problem rather than a missing file.

> **Foundation — What "environment" means**
>
> The word gets used loosely for two related things, and the course uses both:
>
> **1. The environment of a process.** A set of key–value strings that the operating system attaches to every process — `PATH`, `HOME`, `USER`, and whatever else you define. A child process inherits a copy of its parent's environment. This is the mechanism behind configuration-by-environment-variable, which you will meet again in Chapter 11.
>
> **2. Your development environment.** The whole collection of software you have installed to work: the PHP binary, a web server, a database server, an editor, a database GUI. When people say "set up your environment", they mean this.
>
> Later, the word appears a third time in *local environment vs. production environment* — the same code running on your laptop versus on a public server, with different credentials and different settings. Chapter 11 makes that concrete.

## How PHP gets onto your machine, and why it matters here

There is more than one way to install PHP, and the choice changes exactly one thing for this course: **where you are allowed to put your project folders.**

- **A package manager** (Homebrew on macOS, `apt`/`dnf` on Linux, or an equivalent on Windows) installs the `php` binary into a system location and puts it on your `PATH`. Nothing else is bundled. You get to keep your websites in any directory you like.
- **A bundled stack** (MAMP, XAMPP, Laragon and similar) installs PHP *plus* a web server (Apache or Nginx) *plus* MySQL, pre-wired together. These stacks usually serve files out of one specific directory — `htdocs`, `www`, or similar. Their documentation names it. Put your projects there.

Neither is better. But if you went the bundled route, read that documentation once now, because "why is my page not loading" is nearly always "the file is not in the directory the server is looking at".

This guide assumes the package-manager route, which is why it can put projects anywhere.

---

## Making a place to work

> **Foundation — The filesystem as a tree**
>
> Files live in directories; directories live inside other directories; there is exactly one directory at the very top. On macOS and Linux that top is `/`, the root. On Windows each drive has its own root, `C:\`.
>
> A **path** is a route through that tree. `/Users/you/websites/demo` is an *absolute* path — it starts at the root and is unambiguous from anywhere. `websites/demo` is a *relative* path — it means "starting from wherever I currently am".
>
> Every process has a **current working directory**, its position in the tree. `cd` changes it. This is why `cd` has to be built into the shell rather than being a separate program: a separate process changing its own directory and then exiting would leave your shell exactly where it was.
>
> Two shorthands appear constantly: `.` is the current directory, `..` is the parent. And `~` expands to your home directory — `/Users/you` on macOS, `/home/you` on Linux.

Open a terminal and create a home for your projects:

```bash
cd ~
mkdir websites
cd websites
```

`mkdir` is short for *make directory*. `cd` is *change directory*. The name `websites` is arbitrary — plenty of people use `code`, `projects`, `dev`. Pick one and be consistent, because consistency is what makes muscle memory possible.

On Windows without a Unix-style shell, the equivalent is roughly `cd C:\Users\yourname\Desktop` and then the same `mkdir`.

Now the project itself:

```bash
mkdir demo
cd demo
```

You are now standing inside an empty directory. That directory is your website.

## The editor

Open the `demo` **folder** in your editor, not individual files. Every serious editor — PhpStorm, VS Code, Sublime — is built around the idea of an open project directory: it indexes the files, it can search across them, and it can tell you when you reference something that does not exist. Opening loose files throws all of that away.

The menu item is `File → Open Folder`, `Open Directory`, or on some setups a right-click `Open Here` from the file manager.

> **Foundation — Why an IDE knows things a text editor doesn't**
>
> An editor like PhpStorm parses your code the way PHP itself would, building an internal model of every variable, function and class in the project. That model is what powers autocompletion, "go to definition", and the squiggly underlines warning you about an undefined variable.
>
> The model is an approximation, and it can be wrong — you will hit a case of exactly that in Chapter 07, where the editor loses track of variables across a `require`. Knowing that the warnings come from a *separate* analysis, not from PHP itself, is what lets you judge when to ignore one.

---

## What you have at the end of this chapter

A directory. That is genuinely all — but you now know what the shell is, what a process is, what `PATH` does, what an interpreter does, and what people mean by "environment". Those five things are the ground everything else stands on.

**Next:** [02 — HTTP, servers, and your first dynamic page](02-http-and-first-page.md)
