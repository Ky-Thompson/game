FROM node:8.14.0

# Install dependencies
RUN echo "deb mirror://mirrors.ubuntu.com/mirrors.txt trusty main restricted universe multiverse" > /etc/apt/sources.list && \
  echo "deb mirror://mirrors.ubuntu.com/mirrors.txt trusty-updates main restricted universe multiverse" >> /etc/apt/sources.list && \
  echo "deb mirror://mirrors.ubuntu.com/mirrors.txt trusty-security main restricted universe multiverse" >> /etc/apt/sources.list && \
  DEBIAN_FRONTEND=noninteractive apt-get update
RUN apt-get update -q \
  && apt-get install -y -q --no-install-recommends wget software-properties-common libglu1-mesa libglib2.0-0 libstdc++6 \
  && rm -rf /var/lib/apt/lists/*

# Install Texture Packer
WORKDIR /tmp
RUN wget https://www.codeandweb.com/download/texturepacker/4.11.1/TexturePacker-4.11.1-ubuntu64.deb -O TexturePacker.deb -q
RUN dpkg -i TexturePacker.deb \
  && apt-get install -f -y --no-install-recommends \
  && rm -rf /var/cache/apk/* \
  && rm -rf TexturePacker.deb \
  && echo 'agree' | TexturePacker --license-info

# Set WORKDIR and install dependencies
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci

# Copy source files and run tests
COPY . .
ENV NODE_ENV=production
RUN npm run build