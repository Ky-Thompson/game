# Caleb and Sophia Adventures

See the game online at https://caleb-sophia-madrid.github.io/game/

## Pre-requisites

* Install [Texture Packer](https://www.codeandweb.com/texturepacker)
* Install [Tiled Map Editor](https://www.mapeditor.org/)
* Install [NodeJS](https://nodejs.org/es/) version greater than 8.15
* Install [GitBash](https://gitforwindows.org/)

You can download some of them from [here](https://github.com/caleb-sophia-madrid/game/tree/master/bin).

## Clone the repository

In a console do:

```shell
git clone https://github.com/caleb-sophia-madrid/game
cd caleb-sophia-madrid
npm ci
```

## Develop

In a console do:

```shell
npm start
```

It will compile all needed files, open a browser, and reload it when any changes are made.

## Contribute

```shell
git checkout -b <branch> # Creates a new branch
git add --all # Adds files to the branch
git commit -m "Explanation of the change"
git push origin <branch>
```

And submit a Pull Request from GitHub.

After checkout the master branch again:

```shell
git checkout -f # Discard any existing changes
git checkout master
git pull --rebase # Get latest changes
```

## PixelArt resources

Use a [limited color palette](https://stuartspixelgames.com/2018/07/15/retro-game-colour-palettes-and-tools/), for example [Arcade Standard 29 Palette](https://lospec.com/palette-list/arcade-standard-29):

![palette](https://stuartspixelgames.files.wordpress.com/2018/07/arcade-standard-29.png?w=700)
![palette-example](https://lospec.com/images/palette-list/arcade-standard-29-palette-example-palette-example-by-grafxkid.png)

[PixelEditor](https://lospec.com/pixel-editor/app/arcade-standard-29) is a good online editor for pixel art, used along with for example [Paint.NET](https://www.getpaint.net/).

Some online resources:

* [Techniques and common mistakes](https://www.youtube.com/watch?v=gW1G_FLsuEs)
* [Learn with limits](https://www.youtube.com/watch?v=FbCw-_iRdc8)
* [Cute platformer sisters spritesheet](https://opengameart.org/content/cute-platformer-sisters)
* [Generic platformer tiles](https://opengameart.org/content/generic-platformer-tiles)