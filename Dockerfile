FROM debian:latest

RUN apt-get update \
  && apt-get install -y wget libglu1-mesa libglib2.0-0 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /tmp
RUN wget https://www.codeandweb.com/download/texturepacker/4.11.1/TexturePacker-4.11.1-ubuntu64.deb -O TexturePacker.deb -q
RUN dpkg -i TexturePacker.deb \
  && apt-get install -f -y \
  && rm -rf /var/cache/apk/* \
  && rm -rf TexturePacker.deb \
  && echo 'agree' | TexturePacker --license-info

WORKDIR /usr/src/app